import React from 'react';

import { APIRequestPlayground } from './APIRequestPlayground';

export default {
  title: 'Business/APIRequestPlayground',
  component: APIRequestPlayground,
};

export const Playground = () => (
  <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, background: '#181818' }}>
    <APIRequestPlayground />
  </div>
);
