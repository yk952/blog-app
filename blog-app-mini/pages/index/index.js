import { get } from '../../utils/request';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    blogList: [], // 博客列表数据
    page: 1, // 当前页码
    size: 10, // 每页条数
    hasMore: true, // 是否有更多数据
    loading: false // 加载状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getBlogList();
  },

  /**
   * 获取博客列表
   */
  async getBlogList() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    try {
      const res = await get('/blog/list', {
        page: this.data.page,
        size: this.data.size
      });
      
      if (res.code === 0) {
        const newList = this.data.page === 1 ? res.data.list : [...this.data.blogList, ...res.data.list];
        this.setData({
          blogList: newList,
          hasMore: res.data.hasMore,
          page: this.data.page + 1
        });
      } else {
        wx.showToast({ title: res.msg, icon: 'none' });
      }
    } catch (err) {
      console.error('获取博客列表失败：', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    });
    this.getBlogList().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    this.getBlogList();
  },

  /**
   * 跳转到博客详情页
   */
  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
},);