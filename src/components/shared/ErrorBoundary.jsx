/**
 * 错误边界组件 — 捕获渲染错误，显示友好的错误提示
 */
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4">
          <h1 className="font-display text-accent text-4xl mb-4">出了一点问题</h1>
          <p className="text-secondary text-sm mb-6">
            {this.state.error?.message || '未知错误'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="bg-accent text-text-inverse px-6 py-2.5 rounded-button font-medium hover:opacity-90"
          >
            刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
