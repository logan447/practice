/**
 * The last thing standing between a bug and a white page.
 *
 * This prototype keeps its state in the browser, so a change to the
 * shape of that state can meet a record saved by an older version and
 * throw on render. React's answer to an uncaught render error is to
 * unmount the whole tree, which is a blank screen with no way back:
 * reloading restores the same saved state and crashes the same way,
 * and the person evaluating the thing is stuck with no route out and
 * no idea why.
 *
 * So every crash lands here instead. It says what happened, it offers
 * the one action that reliably fixes a state-shape problem, and it
 * keeps that action explicit rather than clearing anything on its own.
 * Throwing away somebody's saved work to recover from a bug is a
 * decision for them to make, not for the thing that just crashed.
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { wipe } from '../lib/persist';

interface State {
  error?: Error;
  where?: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep the component stack: for a shape mismatch it names the
    // section that could not render, which is most of the diagnosis.
    this.setState({ error, where: info.componentStack?.split('\n')[1]?.trim() });
  }

  render(): ReactNode {
    const { error, where } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash">
        <div className="crashbox">
          <h1>This screen could not be drawn</h1>
          <p>
            Something in the saved data did not match what the code expected, so
            the page stopped rather than showing you something wrong. Nothing
            has been lost or changed.
          </p>
          <p className="crashwhy">
            {error.message}
            {where && <span className="crashwhere">{where}</span>}
          </p>
          <p>
            This is almost always a record saved by an older version of the
            prototype. Clearing the saved data and starting again from the
            examples fixes it. Anything you typed into this prototype will go
            with it.
          </p>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn" onClick={() => { wipe(); location.reload(); }}>
              Clear saved data and reload
            </button>
            <button className="btn ghost" onClick={() => location.reload()}>
              Just reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
