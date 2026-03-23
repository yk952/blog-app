// 1. 导入依赖（替换mongoose为mysql2）
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path'); // 修正：path导入错误（之前写成了fs）
const fs = require('fs');
const axios = require('axios');
// 核心：导入mysql2（支持Promise，异步操作更友好）
const mysql = require('mysql2/promise'); 

const app = express();
const PORT = 3000;

// 2. 全局配置（和之前一致）
app.use(cors({
  origin: ['https://servicewechat.com', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 静态资源（图片）
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// 3. 配置MySQL连接（核心改动：密码改成最终可用的版本）
const dbConfig = {
  host: 'localhost', // 本地Docker的MySQL地址（服务器填服务器IP）
  port: 3306, // 映射的端口
  user: 'root', // 咱们手动创建的普通用户
  password: '123456', // ✅ 最终确认的blog_user密码（重点改这里）
  database: 'blog_db', // 自动/手动创建的数据库
  charset: 'utf8mb4' // 支持中文/emoji
};

// 4. 初始化MySQL连接+创建表结构（关键：替代MongoDB的模型）
async function initDB() {
  try {
    // 建立数据库连接
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL数据库连接成功！');

    // 创建博客表（替代MongoDB的Schema）
    // 表结构：id(主键自增)、title(标题)、content(内容)、author(作者)、cover(封面)、create_time(创建时间)
    const createBlogTableSql = `
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(50) NOT NULL,
        cover VARCHAR(255),
        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.execute(createBlogTableSql);
    console.log('✅ 博客表创建/验证成功！');

    // 释放临时连接
    await connection.end();
  } catch (err) {
    console.error('❌ MySQL初始化失败：', err);
    process.exit(1); // 初始化失败则退出程序
  }
}
// 启动时执行数据库初始化
initDB();

// 5. 封装MySQL通用查询方法（简化接口代码）
async function query(sql, params = []) {
  // 每次请求创建新连接（简单版，生产可改用连接池）
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    await connection.end(); // 确保连接释放
  }
}

// 6. 文件上传配置（和之前一致，无需改动）
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('❌ 只能上传图片！'), false);
  }
});

// 7. 改造后的核心接口（适配MySQL语法）
// 7.1 获取博客列表（替代MongoDB的find）
app.get('/api/blog/list', async (req, res) => {
  try {
    // SQL：查询所有博客，按创建时间倒序
    const sql = 'SELECT * FROM blogs ORDER BY create_time DESC';
    const blogs = await query(sql);
    res.json({
      code: 200,
      msg: '获取博客列表成功',
      data: blogs
    });
  } catch (err) {
    res.json({
      code: 500,
      msg: '获取失败：' + err.message,
      data: null
    });
  }
});

// 7.2 发布博客（替代MongoDB的save）
app.post('/api/blog/publish', async (req, res) => {
  try {
    const { title, content, author, cover } = req.body;
    // SQL：插入数据（?是参数占位符，防止SQL注入）
    const sql = `
      INSERT INTO blogs (title, content, author, cover)
      VALUES (?, ?, ?, ?)
    `;
    // 执行插入，params和占位符一一对应
    const result = await query(sql, [title, content, author, cover]);
    // 返回插入的博客信息（包含自增id）
    res.json({
      code: 200,
      msg: '博客发布成功',
      data: {
        id: result.insertId,
        title,
        content,
        author,
        cover,
        create_time: new Date()
      }
    });
  } catch (err) {
    res.json({
      code: 500,
      msg: '发布失败：' + err.message,
      data: null
    });
  }
});

// 7.3 上传封面图（和之前一致）
app.post('/api/upload/cover', upload.single('file'), (req, res) => {
  try {
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({
      code: 200,
      msg: '图片上传成功',
      data: { url: fileUrl }
    });
  } catch (err) {
    res.json({
      code: 500,
      msg: '上传失败：' + err.message,
      data: null
    });
  }
});

// 7.4 微信登录（需要替换成你的小程序信息）
app.post('/api/wx/login', async (req, res) => {
  try {
    const { code } = req.body;
    const APPID = '你的小程序AppID'; // ❗ 替换成自己的小程序AppID
    const APPSECRET = '你的小程序AppSecret'; // ❗ 替换成自己的小程序AppSecret
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: { appid: APPID, secret: APPSECRET, js_code: code, grant_type: 'authorization_code' }
    });
    res.json({ code: 200, msg: '登录成功', data: response.data });
  } catch (err) {
    res.json({ code: 500, msg: '登录失败：' + err.message, data: null });
  }
});

// 8. 启动服务
app.listen(PORT, () => {
  console.log(`🚀 后端服务启动成功！访问地址：http://localhost:${PORT}`);
});