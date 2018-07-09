import React from 'react';
import { Router } from 'react-router';
import Routes from '../routes';

export default class Root extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Router history={this.props.history}>
        <Routes />
      </Router>
    );
  }
}
