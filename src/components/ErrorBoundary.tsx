import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * The last line of defence. Without this, one bad render takes the whole
 * app to a white screen with no UI left to recover from, which is the
 * worst possible outcome for a caretaker who is already having a hard day.
 *
 * It deliberately offers a way out that does not need a developer: try
 * again, go home, or switch to another profile when the loaded one is the
 * thing that is broken. It never offers to delete anything.
 */
interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No analytics service to send this to, and we would not send a
    // family's data anywhere regardless. The console is for whoever is
    // helping them.
    console.error('Keepsake hit an unexpected error:', error, info)
  }

  private goHome = () => {
    window.location.hash = '#/'
    window.location.reload()
  }

  private clearActiveProfile = () => {
    try {
      const raw = localStorage.getItem('keepsake:app')
      const state = raw ? JSON.parse(raw) : {}
      delete state.activeProfileId
      localStorage.setItem('keepsake:app', JSON.stringify(state))
    } catch {
      // If storage is unavailable there is nothing to clear.
    }
    this.goHome()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="card max-w-xl text-center">
          <p className="text-4xl" aria-hidden="true">
            🌿
          </p>
          <h1 className="mt-4 text-3xl">Something went wrong on our end.</h1>
          <p className="mt-3 text-lg text-ink-muted">
            Nothing has been lost. Everything Keepsake knows is still saved on
            this device. This is a problem with the app, not with anything you
            did.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-[48px] items-center rounded-lg bg-[#946033] px-6 font-semibold text-[#FDF8EE] shadow-[3px_4px_0_#3D2F24]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.goHome}
              className="inline-flex min-h-[48px] items-center rounded-lg border-2 border-[#C9B493] bg-[#FFFDF6] px-6 font-semibold text-[#6E5233]"
            >
              Back to the start
            </button>
          </div>

          <p className="mt-6 border-t border-cream-deep pt-5 text-base text-ink-muted">
            If it keeps happening right after opening a profile, that profile
            may not have restored cleanly.
          </p>
          <button
            type="button"
            onClick={this.clearActiveProfile}
            className="mt-2 inline-flex min-h-[44px] items-center rounded-lg px-3 text-base font-semibold underline underline-offset-4"
          >
            Open a different profile instead
          </button>
        </div>
      </div>
    )
  }
}
