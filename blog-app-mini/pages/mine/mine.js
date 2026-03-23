Page({
  data: {
    isLogin: false,    // 是否登录
    userInfo: {}       // 用户信息
  },

  onShow() {
    // 每次显示页面刷新登录状态
    this.checkLogin();
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({
      isLogin: !!token,
      userInfo: userInfo || {}
    });
  },

  // 跳转到登录页
  goLogin() {
    wx.navigateTo({ url: '/pages/auth/login' });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          this.setData({
            isLogin: false,
            userInfo: {}
          });
          wx.showToast({ title: '退出成功', icon: 'success' });
        }
      }
    });
  },

  // 我的发布
  goMyArticle() {
    wx.navigateTo({ url: '/pages/myArticle/myArticle' });
  },

  // 我的收藏
  goMyCollection() {
    wx.navigateTo({ url: '/pages/collection/collection' });
  },

  // 意见反馈
  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },

  // 关于我们
  goAbout() {
    wx.showModal({
      title: '关于我们',
      content: '我的博客小程序 v1.0\n© 2026 所有权利保留',
      showCancel: false
    });
  }
});