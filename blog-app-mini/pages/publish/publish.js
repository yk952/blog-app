import { get, post } from '../../utils/request';

Page({
  data: {
    title: '',                // 文章标题
    content: '',              // 文章内容
    images: [],               // 图片列表（本地路径/服务器路径）
    categoryList: [],         // 分类列表
    selectedCategory: {},     // 选中的分类
    tempImages: []            // 临时图片路径
  },

  // 页面加载获取分类列表
  onLoad() {
    this.getCategoryList();
  },

  // 获取分类列表
  getCategoryList() {
    get('/category/list').then(res => {
      if (res.code === 200) {
        this.setData({ categoryList: res.data });
      }
    }).catch(err => {
      wx.showToast({ title: '获取分类失败', icon: 'none' });
    });
  },

  // 输入标题
  inputTitle(e) {
    this.setData({ title: e.detail.value });
  },

  // 富文本内容变化
  contentChange(e) {
    this.setData({ content: e.detail.content });
  },

  // 选择分类
  showCategoryPicker() {
    const { categoryList } = this.data;
    if (categoryList.length === 0) {
      return wx.showToast({ title: '暂无分类', icon: 'none' });
    }

    wx.showActionSheet({
      itemList: categoryList.map(item => item.name),
      success: (res) => {
        const selected = categoryList[res.tapIndex];
        this.setData({ selectedCategory: selected });
      }
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 9 - this.data.images.length, // 最多选择剩余数量
      sizeType: ['compressed'],           // 只选压缩图
      sourceType: ['album', 'camera'],    // 相册/相机
      success: (res) => {
        const tempPaths = res.tempFilePaths;
        this.setData({ 
          tempImages: [...this.data.tempImages, ...tempPaths],
          images: [...this.data.images, ...tempPaths] // 先显示临时路径
        });
        // 上传图片到服务器
        this.uploadImages(tempPaths);
      }
    });
  },

  // 上传图片到服务器
  uploadImages(tempPaths) {
    wx.showLoading({ title: '上传图片中...' });
    const uploadPromises = tempPaths.map(path => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: 'https://你的域名/api/upload', // 替换为实际上传接口
          filePath: path,
          name: 'file',
          header: {
            'token': wx.getStorageSync('token')
          },
          success: (res) => {
            const data = JSON.parse(res.data);
            if (data.code === 200) {
              resolve(data.data.url); // 返回服务器图片地址
            } else {
              reject(data.msg);
            }
          },
          fail: (err) => {
            reject('上传失败');
          }
        });
      });
    });

    // 所有图片上传完成
    Promise.all(uploadPromises).then(urls => {
      wx.hideLoading();
      // 替换临时路径为服务器路径
      const newImages = this.data.images.map((item, index) => {
        if (this.data.tempImages.includes(item)) {
          return urls.shift() || item;
        }
        return item;
      });
      this.setData({ 
        images: newImages,
        tempImages: []
      });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err || '图片上传失败', icon: 'none' });
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
  },

  // 发布文章
  publishArticle() {
    const { title, content, selectedCategory, images } = this.data;
    wx.showLoading({ title: '发布中...' });

    post('/article/publish', {
      title,
      content,
      categoryId: selectedCategory.id,
      images: images.join(',') // 拼接图片地址为字符串
    }).then(res => {
      if (res.code === 200) {
        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
        }, 1500);
      } else {
        wx.showToast({ title: res.msg || '发布失败', icon: 'none' });
      }
    }).catch(err => {
      wx.showToast({ title: '网络错误', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  }
});