import axios from 'axios'
import { ElMessage } from 'element-plus'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

client.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const status = error.response?.status
    const serverMsg = error.response?.data?.error?.message

    // 404 不弹错误（由各组件自行处理空状态）
    if (status === 404) {
      return Promise.reject(error)
    }

    // 网络不通 / 超时
    if (!status) {
      const msg = error.code === 'ECONNABORTED'
        ? '请求超时，请检查后端服务是否启动'
        : '网络请求失败，请确认后端已启动'
      ElMessage.error(msg)
      return Promise.reject(error)
    }

    // 其他服务端错误
    ElMessage.error(serverMsg || `请求失败 (${status})`)

    return Promise.reject(error)
  }
)

export default client
