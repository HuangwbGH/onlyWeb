-- 吉信德｜采购执行进度表 v1
-- 数据库：UFDATA_101_2018
-- 说明：第一版可执行 SQL（过渡版），用于先验证采购执行主链路。
-- 当前策略：
-- 1) 以请购层为主入口
-- 2) 采购层先明细后汇总
-- 3) 可用量先保留未领量占位接口
-- 4) 需求量第一版先用请购数量替代
-- 5) 目标到位日期第一版先回退为请购需求日期 / 最晚采购计划到货日期

WITH stock_base AS (
    SELECT
        cInvCode,
        SUM(iQuantity) AS onhand_qty
    FROM CurrentStock
    WHERE cWhCode IN ('01','02','03','11','12','13','24','25','26','27')
    GROUP BY cInvCode
),
req_base AS (
    SELECT
        CASE
            WHEN ISNULL(vouchs.csocode, '') <> '' THEN N'销售订单型'
            ELSE N'独立请购型'
        END AS demand_source_type,
        CASE
            WHEN ISNULL(vouchs.csocode, '') <> '' THEN vouchs.csocode
            ELSE vouch.cCode
        END AS demand_source_no,
        CASE
            WHEN ISNULL(vouchs.csocode, '') <> '' THEN CAST(ISNULL(vouchs.irowno, vouchs.ivouchrowno) AS VARCHAR(50))
            ELSE CAST(vouchs.ivouchrowno AS VARCHAR(50))
        END AS demand_source_row_no,
        CASE
            WHEN ISNULL(vouchs.csocode, '') <> '' THEN N'是'
            ELSE N'否'
        END AS has_so_link,
        vouchs.csocode AS so_code,
        vouchs.irowno AS so_row_no,
        ISNULL(so_ex.chdefine12, so_m.ccusname) AS customer_name,
        vouch.cCode AS app_code,
        vouchs.ivouchrowno AS app_row_no,
        vouch.cDefine8 AS app_factory,
        vouchs.dRequirDate AS app_require_date,
        i.cInvCode AS inv_code,
        i.cInvAddCode AS inv_add_code,
        i.cInvName AS inv_name,
        i.cInvStd AS inv_std,
        i.cInvDefine10 AS cloth_card_no,
        c.cComUnitName AS unit_name,
        i.cinvDefine7 AS inv_remark,
        ISNULL(sb.onhand_qty, 0) AS onhand_qty,
        ISNULL(vouchs.fQuantity, 0) AS app_qty,
        ISNULL(vouchs.iReceivedQTY, 0) AS po_released_qty,
        ISNULL(vouchs.fQuantity, 0) - ISNULL(vouchs.iReceivedQTY, 0) AS app_unreleased_qty
    FROM PU_AppVouch vouch
    INNER JOIN PU_AppVouchs vouchs
        ON vouch.ID = vouchs.ID
    INNER JOIN Inventory i
        ON i.cInvCode = vouchs.cInvCode
    INNER JOIN ComputationUnit c
        ON i.cComUnitCode = c.cComunitCode
    LEFT JOIN SO_SOMain so_m
        ON vouchs.csocode = so_m.csocode
    LEFT JOIN SO_SOMain_extradefine so_ex
        ON so_m.ID = so_ex.ID
    LEFT JOIN stock_base sb
        ON sb.cInvCode = i.cInvCode
    WHERE ISNULL(vouchs.cbcloser, '') = ''
      AND ISNULL(vouch.cVerifier, '') <> ''
),
po_detail AS (
    SELECT
        vouch.cCode AS app_code,
        vouchs.ivouchrowno AS app_row_no,
        vouchs.csocode AS so_code,
        vouchs.irowno AS so_row_no,
        pd.cInvCode AS inv_code,
        CASE
            WHEN pm.dCloseDate IS NULL THEN N'打开'
            ELSE N'关闭'
        END AS po_status,
        pm.cPOID AS po_code,
        pm.dPODate AS po_date,
        pd.dArriveDate AS po_arrive_date,
        v.cVenCode AS vendor_code,
        v.cVenName AS vendor_name,
        ISNULL(pd.iQuantity, 0) AS po_qty,
        ISNULL(pd.fPoArrQuantity, 0) AS arrived_qty,
        ISNULL(pd.freceivedqty, 0) AS received_qty,
        ISNULL(pd.iQuantity, 0) - ISNULL(pd.fPoArrQuantity, 0) AS not_arrived_qty,
        ISNULL(pd.fPoArrQuantity, 0) - ISNULL(pd.freceivedqty, 0) AS arrived_not_received_qty,
        ISNULL(pd.iQuantity, 0) - ISNULL(pd.freceivedqty, 0) AS po_in_transit_qty
    FROM PO_Pomain pm
    INNER JOIN PO_Podetails pd
        ON pd.POID = pm.POID
    LEFT JOIN PU_AppVouchs vouchs
        ON pd.iAppIds = vouchs.AutoID
    LEFT JOIN PU_AppVouch vouch
        ON vouch.ID = vouchs.ID
    LEFT JOIN Vendor v
        ON v.cVenCode = pm.cVenCode
    WHERE ISNULL(pd.cbCloser, '') = ''
),
po_exec AS (
    SELECT
        app_code,
        app_row_no,
        so_code,
        so_row_no,
        inv_code,
        SUM(po_qty) AS po_qty,
        SUM(arrived_qty) AS arrived_qty,
        SUM(received_qty) AS received_qty,
        SUM(not_arrived_qty) AS not_arrived_qty,
        SUM(arrived_not_received_qty) AS arrived_not_received_qty,
        SUM(po_in_transit_qty) AS po_in_transit_qty,
        MIN(po_arrive_date) AS first_po_arrive_date,
        MAX(po_arrive_date) AS last_po_arrive_date
    FROM po_detail
    GROUP BY app_code, app_row_no, so_code, so_row_no, inv_code
),
issue_base AS (
    -- 已领量（基础版）：生产订单领料出库
    SELECT
        d.iorderdid AS order_did,
        d.iordercode AS order_code,
        d.cInvCode AS inv_code,
        SUM(ISNULL(d.iQuantity, 0)) AS issued_qty
    FROM RdRecord11 h
    INNER JOIN rdrecords11 d
        ON h.ID = d.ID
    WHERE h.cBusType = N'领料'
      AND h.cSource = N'生产订单'
      AND d.iorderdid IS NOT NULL
    GROUP BY d.iorderdid, d.iordercode, d.cInvCode
),
should_issue_base AS (
    -- 应领量（基础版）：先取生产订单材料明细数量
    SELECT
        m.OrderDId AS order_did,
        m.OrderCode AS order_code,
        m.InvCode AS inv_code,
        SUM(ISNULL(m.Qty, 0)) AS should_issue_qty
    FROM mom_orderdetail m
    WHERE m.OrderDId IS NOT NULL
    GROUP BY m.OrderDId, m.OrderCode, m.InvCode
),
unissued_detail AS (
    -- 未领量（基础版）= 应领量 - 已领量
    -- 补料量后续若确认有稳定数据，再叠加进来
    SELECT
        s.order_did,
        s.order_code,
        s.inv_code,
        s.should_issue_qty,
        ISNULL(i.issued_qty, 0) AS issued_qty,
        CASE
            WHEN s.should_issue_qty - ISNULL(i.issued_qty, 0) < 0 THEN 0
            ELSE s.should_issue_qty - ISNULL(i.issued_qty, 0)
        END AS unissued_qty
    FROM should_issue_base s
    LEFT JOIN issue_base i
        ON s.order_did = i.order_did
       AND s.order_code = i.order_code
       AND s.inv_code = i.inv_code
),
unissued_base AS (
    -- 按物料汇总未领量（基础版）
    SELECT
        inv_code,
        SUM(unissued_qty) AS unissued_qty
    FROM unissued_detail
    GROUP BY inv_code
),
avail_calc AS (
    SELECT
        sb.cInvCode AS inv_code,
        ISNULL(sb.onhand_qty, 0) AS onhand_qty,
        ISNULL(ub.unissued_qty, 0) AS unissued_qty
    FROM stock_base sb
    LEFT JOIN unissued_base ub
        ON sb.cInvCode = ub.inv_code
),
demand_merge AS (
    SELECT
        rb.demand_source_type,
        rb.demand_source_no,
        rb.demand_source_row_no,
        rb.has_so_link,
        rb.so_code,
        rb.so_row_no,
        rb.customer_name,
        rb.app_code,
        rb.app_row_no,
        rb.app_factory,
        rb.app_require_date,
        rb.inv_code,
        rb.inv_add_code,
        rb.inv_name,
        rb.inv_std,
        rb.cloth_card_no,
        rb.unit_name,
        rb.inv_remark,
        ISNULL(ac.onhand_qty, rb.onhand_qty) AS onhand_qty,
        ISNULL(ac.unissued_qty, 0) AS unissued_qty,
        ISNULL(rb.app_qty, 0) AS demand_qty,
        ISNULL(rb.app_qty, 0) AS app_qty,
        ISNULL(rb.po_released_qty, 0) AS po_released_qty,
        ISNULL(rb.app_unreleased_qty, 0) AS app_unreleased_qty,
        ISNULL(pe.po_qty, 0) AS po_qty,
        ISNULL(pe.arrived_qty, 0) AS arrived_qty,
        ISNULL(pe.received_qty, 0) AS received_qty,
        ISNULL(pe.not_arrived_qty, 0) AS not_arrived_qty,
        ISNULL(pe.arrived_not_received_qty, 0) AS arrived_not_received_qty,
        ISNULL(pe.po_in_transit_qty, 0) AS po_in_transit_qty,
        pe.first_po_arrive_date,
        pe.last_po_arrive_date,
        ISNULL(ac.onhand_qty, rb.onhand_qty) - ISNULL(ac.unissued_qty, 0) + ISNULL(pe.po_in_transit_qty, 0) AS remain_available_qty,
        CASE
            WHEN rb.demand_source_type = N'销售订单型' THEN rb.app_require_date
            ELSE ISNULL(pe.last_po_arrive_date, rb.app_require_date)
        END AS target_ready_date
    FROM req_base rb
    LEFT JOIN po_exec pe
        ON rb.app_code = pe.app_code
       AND rb.app_row_no = pe.app_row_no
       AND rb.inv_code = pe.inv_code
    LEFT JOIN avail_calc ac
        ON rb.inv_code = ac.inv_code
),
risk_output AS (
    SELECT
        dm.*,
        CASE WHEN dm.remain_available_qty >= dm.demand_qty THEN 0 ELSE dm.demand_qty - dm.remain_available_qty END AS gap_qty,
        CASE WHEN dm.remain_available_qty >= dm.demand_qty THEN N'是' ELSE N'否' END AS is_demand_met,
        CASE
            WHEN ISNULL(dm.demand_qty, 0) = 0 THEN N'待人工确认'
            WHEN dm.app_unreleased_qty > 0 THEN N'请购未下达采购'
            WHEN dm.not_arrived_qty > 0 THEN N'已采购未到货'
            WHEN dm.arrived_not_received_qty > 0 THEN N'已到货未入库'
            WHEN dm.remain_available_qty < dm.demand_qty THEN N'已入库但可用量不足'
            ELSE N'材料已满足'
        END AS current_bottleneck,
        CASE
            WHEN dm.target_ready_date IS NOT NULL AND CAST(GETDATE() AS DATE) > CAST(dm.target_ready_date AS DATE) THEN N'是'
            ELSE N'否'
        END AS is_overdue,
        CASE
            WHEN dm.target_ready_date IS NOT NULL AND CAST(GETDATE() AS DATE) > CAST(dm.target_ready_date AS DATE)
            THEN DATEDIFF(DAY, dm.target_ready_date, GETDATE())
            ELSE 0
        END AS overdue_days,
        CASE
            WHEN dm.demand_qty IS NULL OR dm.target_ready_date IS NULL THEN N'待确认'
            WHEN dm.remain_available_qty < dm.demand_qty AND CAST(GETDATE() AS DATE) >= CAST(dm.target_ready_date AS DATE) THEN N'是'
            WHEN dm.remain_available_qty < dm.demand_qty THEN N'待确认'
            ELSE N'否'
        END AS is_affecting_demand,
        CASE
            WHEN dm.demand_qty IS NULL OR dm.target_ready_date IS NULL THEN N'待确认'
            WHEN dm.remain_available_qty < dm.demand_qty AND CAST(GETDATE() AS DATE) >= CAST(dm.target_ready_date AS DATE) THEN N'高'
            WHEN dm.app_unreleased_qty > 0 OR dm.not_arrived_qty > 0 OR dm.arrived_not_received_qty > 0 OR dm.remain_available_qty < dm.demand_qty THEN N'中'
            ELSE N'低'
        END AS risk_level,
        CASE
            WHEN ISNULL(dm.demand_qty, 0) = 0 THEN N'数据待确认'
            WHEN dm.app_unreleased_qty > 0 THEN N'请购未下达'
            WHEN dm.not_arrived_qty > 0 THEN N'采购未交货'
            WHEN dm.arrived_not_received_qty > 0 THEN N'到货未入库'
            WHEN dm.remain_available_qty < dm.demand_qty THEN N'可用量不足'
            ELSE N'已满足'
        END AS risk_reason
    FROM demand_merge dm
)
SELECT *
FROM risk_output
ORDER BY demand_source_type, demand_source_no, demand_source_row_no, inv_code;
