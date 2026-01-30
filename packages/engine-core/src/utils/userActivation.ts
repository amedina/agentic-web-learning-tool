/**
 * User Activation Gesture Utility
 *
 * Provides a mechanism to wait for a user gesture (click) on the page.
 * Necessary for browser APIs that require user activation.
 */

class UserActivationManager {
  private container: HTMLDivElement | null = null;
  private resolveFn: (() => void) | null = null;

  /**
   * Request user activation by showing a floating button and awaiting click.
   * @returns Promise resolving when the user clicks the button.
   */
  public async requestActivation(): Promise<void> {
    // If already waiting, return existing promise
    if (this.resolveFn) {
      return new Promise((resolve) => {
        const oldResolve = this.resolveFn;
        this.resolveFn = () => {
          oldResolve?.();
          resolve();
        };
      });
    }

    return new Promise((resolve) => {
      this.resolveFn = resolve;
      this.createUI();
    });
  }

  private createUI(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'awlt-user-activation-trigger';
    this.container.innerHTML = `
      <div class="awlt-activation-glass">
        <button class="awlt-activation-btn">
          <span class="awlt-btn-icon">⚡</span>
          <span class="awlt-btn-text">Click to continue workflow</span>
        </button>
      </div>
    `;

    this.injectStyles();
    document.body.appendChild(this.container);

    const btn = this.container.querySelector('button');
    btn?.addEventListener('click', () => {
      this.handleActivation();
    });
  }

  private handleActivation(): void {
    if (this.resolveFn) {
      this.resolveFn();
      this.resolveFn = null;
    }
    this.destroy();
  }

  private destroy(): void {
    if (this.container) {
      this.container.classList.add('awlt-fade-out');
      setTimeout(() => {
        this.container?.remove();
        this.container = null;
      }, 300);
    }
  }

  private injectStyles(): void {
    const styleId = 'awlt-activation-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #awlt-user-activation-trigger {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        transition: opacity 0.3s ease;
      }

      .awlt-activation-glass {
        padding: 4px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 100px;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        animation: awlt-pulse 2s infinite ease-in-out;
      }

      .awlt-activation-btn {
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        border: none;
        color: white;
        padding: 14px 28px;
        border-radius: 100px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        pointer-events: auto;
      }

      .awlt-activation-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
      }

      .awlt-activation-btn:active {
        transform: scale(0.98);
      }

      .awlt-btn-icon {
        font-size: 20px;
      }

      .awlt-fade-out {
        opacity: 0;
        pointer-events: none;
      }

      @keyframes awlt-pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
      }
    `;
    document.head.appendChild(style);
  }
}

export const userActivationManager = new UserActivationManager();
