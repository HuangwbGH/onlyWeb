

在这个 skill 的根目录下创建一个配置文件，用来存放邮箱相关的配置：
export MAIL_HOST=imap.163.com
export MAIL_PORT=993
export MAIL_USER=17506078760@163.com
export MAIL_PASSWORD=UQP5yBTnjcUbynBG
export MAIL_FOLDER=INBOX
export MAIL_FETCH_LIMIT=10



这个 skill 需要实现的功能：从邮箱中下载邮件信息到本地，储存为 EML 格式，后续需要对邮件进行分析