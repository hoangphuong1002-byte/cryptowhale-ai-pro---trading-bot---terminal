import React, { Component, ErrorInfo, ReactNode } from 'react';
import { EmergencyQBLite } from './EmergencyQBLite';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CryptoWhale RootErrorBoundary caught unhandled error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return <EmergencyQBLite error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}
