#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

BACKUP_FILE="${1:-private-backups/onlyweb-private-data.tar.gz.enc}"
RESTORE_DIR="${RESTORE_DIR:-private-backups/restore}"

log() {
  printf '[onlyWeb decrypt] %s\n' "$1"
}

fail() {
  printf '[onlyWeb decrypt] ERROR: %s\n' "$1" >&2
  exit 1
}

command -v openssl >/dev/null 2>&1 || fail "未找到 openssl，无法解密备份包。"
command -v tar >/dev/null 2>&1 || fail "未找到 tar，无法解压备份包。"

[ -f "${BACKUP_FILE}" ] || fail "未找到加密备份包：${BACKUP_FILE}"

if [ -d "${RESTORE_DIR}" ] && [ "$(find "${RESTORE_DIR}" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')" != "0" ]; then
  if [ "${FORCE:-}" != "1" ]; then
    printf '恢复目录已存在且不为空：%s\n' "${RESTORE_DIR}"
    printf '是否清空该目录后重新解密？输入 YES 继续：'
    read -r answer
    [ "${answer}" = "YES" ] || fail "已取消解密。"
  fi
  rm -rf "${RESTORE_DIR:?}"/* "${RESTORE_DIR}"/.[!.]* "${RESTORE_DIR}"/..?* 2>/dev/null || true
fi

mkdir -p "${RESTORE_DIR}"

log "加密包：${BACKUP_FILE}"
log "解密解压到：${RESTORE_DIR}"
log "接下来 openssl 会要求输入加密密码。请输入旧 Mac 导出时设置的密码。"

openssl enc -d -aes-256-cbc -pbkdf2 -in "${BACKUP_FILE}" | tar xzf - -C "${RESTORE_DIR}"

log "解密解压完成。"
log "解压出的文件如下："
find "${RESTORE_DIR}" -maxdepth 1 -type f -print | sort

log "下一步通常是把 sqlite_data.tar.gz 解压到 data/，把 uploads_data.tar.gz 解压到 public/uploads/。详细步骤见 docs/PrivateDataBackupAndMigration.md。"
