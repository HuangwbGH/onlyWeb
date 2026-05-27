#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

DATA_DIR="${DATA_DIR:-data}"
UPLOADS_DIR="${UPLOADS_DIR:-public/uploads}"
BACKUP_DIR="${BACKUP_DIR:-private-backups}"
OUTPUT_NAME="${OUTPUT_NAME:-onlyweb-private-data.tar.gz.enc}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
TMP_DIR="${BACKUP_DIR}/.tmp-export-${TIMESTAMP}"
OUTPUT_PATH="${BACKUP_DIR}/${OUTPUT_NAME}"

log() {
  printf '[onlyWeb backup] %s\n' "$1"
}

fail() {
  printf '[onlyWeb backup] ERROR: %s\n' "$1" >&2
  exit 1
}

command -v openssl >/dev/null 2>&1 || fail "未找到 openssl，无法生成加密备份包。"
command -v tar >/dev/null 2>&1 || fail "未找到 tar，无法生成备份包。"

[ -d "${DATA_DIR}" ] || fail "未找到数据库目录：${DATA_DIR}。请先启动一次项目，或确认 docker-compose.yml 已挂载 ./data。"
[ -d "${UPLOADS_DIR}" ] || fail "未找到上传文件目录：${UPLOADS_DIR}。请先启动一次项目，或手动创建该目录。"

mkdir -p "${BACKUP_DIR}" "${TMP_DIR}"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

log "项目目录：${PROJECT_ROOT}"
log "数据库目录：${DATA_DIR}"
log "上传文件目录：${UPLOADS_DIR}"
log "临时目录：${TMP_DIR}"

log "开始打包 SQLite 数据库目录..."
tar czf "${TMP_DIR}/sqlite_data.tar.gz" -C "${DATA_DIR}" .

log "开始打包上传文件目录..."
tar czf "${TMP_DIR}/uploads_data.tar.gz" -C "${UPLOADS_DIR}" .

if [ -f ".env" ]; then
  log "检测到 .env，已加入加密备份包。"
  cp .env "${TMP_DIR}/.env.backup"
else
  log "未检测到 .env，本次备份不包含 .env。"
  printf 'No .env file was found when this backup was created.\n' > "${TMP_DIR}/NO_ENV_INCLUDED.txt"
fi

cat > "${TMP_DIR}/MANIFEST.txt" <<MANIFEST
onlyWeb private backup
created_at=${TIMESTAMP}
storage_mode=project_folder_bind_mount
data_dir=${DATA_DIR}
uploads_dir=${UPLOADS_DIR}
contains_sqlite_data=true
contains_uploads_data=true
contains_env_backup=$([ -f "${TMP_DIR}/.env.backup" ] && printf 'true' || printf 'false')
MANIFEST

log "开始生成加密包：${OUTPUT_PATH}"
log "接下来 openssl 会要求输入加密密码。请牢记该密码，恢复数据时必须使用。"

tar -C "${TMP_DIR}" -czf - . | openssl enc -aes-256-cbc -pbkdf2 -salt -out "${OUTPUT_PATH}"

chmod 600 "${OUTPUT_PATH}"

log "加密备份已生成：${OUTPUT_PATH}"
log "明文临时文件已自动清理。"
log "可以提交到 GitHub Private 的文件：${OUTPUT_PATH}"
log "提交命令示例：git add ${OUTPUT_PATH} && git commit -m 'update encrypted onlyweb data backup' && git push"
