// blog-app/utils/request.js
const baseUrl = 'https://localhost:3000/api'; // 替换为实际接口地址

/**
 * 封装微信请求
 * @param {String} url 接口路径
 * @param {Object} data 请求参数
 * @param {String} method 请求方法
 */
export const request = (url, data = {}, method = 'GET') => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${url}`,
      data,
      method,
      header: {
        'content-type': 'application/json',
        'token': wx.getStorageSync('token') || '' // 登录态token
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(res.errMsg);
        }
      },
      fail: (err) => {
        reject(err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  });
};

// 快捷方法
export const get = (url, data) => request(url, data, 'GET');
export const post = (url, data) => request(url, data, 'POST');