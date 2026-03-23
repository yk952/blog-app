import { get } from '../../utils/request';

Page({
  data: {
    blogInfo: {}, // 博客详情数据
    commentList: [],      // 评论列表
    commentCount: 0,      // 评论数
    commentContent: '',   // 评论输入内容
    isLogin: false,       // 是否登录
    loadingComment: false // 评论加载状态
  },

  onLoad(options) {
    this.checkLogin();
    if (!options.id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return wx.navigateBack();
    }
    this.getBlogDetail(options.id);
  },

  // 检查登录状态
checkLogin() {
  const token = wx.getStorageSync('token');
  this.setData({ isLogin: !!token });
},

// 跳转到登录页
goLogin() {
  wx.navigateTo({ url: '/pages/auth/login' });
},

// 获取评论列表
getCommentList(articleId) {
  this.setData({ loadingComment: true });
  get(`/comment/list/${articleId}`).then(res => {
    if (res.code === 200) {
      this.setData({
        commentList: res.data.list,
        commentCount: res.data.count
      });
    }
  }).catch(err => {
    wx.showToast({ title: '加载评论失败', icon: 'none' });
  }).finally(() => {
    this.setData({ loadingComment: false });
  });
},

// 刷新评论
refreshComment() {
  this.getCommentList(this.data.blogInfo.id);
},

// 输入评论内容
inputComment(e) {
  this.setData({ commentContent: e.detail.value });
},

// 发送评论
sendComment() {
  const { commentContent, blogInfo } = this.data;
  wx.showLoading({ title: '发送中...' });

  post('/comment/publish', {
    articleId: blogInfo.id,
    content: commentContent.trim()
  }).then(res => {
    if (res.code === 200) {
      wx.showToast({ title: '评论成功', icon: 'success' });
      // 清空输入框，刷新评论
      this.setData({ commentContent: '' });
      this.getCommentList(blogInfo.id);
    } else {
      wx.showToast({ title: res.msg || '评论失败', icon: 'none' });
    }
  }).catch(err => {
    wx.showToast({ title: '网络错误', icon: 'none' });
  }).finally(() => {
    wx.hideLoading();
  }),

  // 获取博客详情
  async getBlogDetail(id) {
    wx.showLoading({ title: '加载中' });
    try {
      const res = await get(`/blog/detail/${id}`);
      if (res.code === 0) {
        this.setData({ blogInfo: res.data });
      } else {
        wx.showToast({ title: res.msg, icon: 'none' });
      }
    } catch (err) {
      console.error('获取博客详情失败：', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
}})