# Reux Data Dispatch

[![npm version](https://img.shields.io/npm/v/redux-data-dispatch.svg?style=flat-square)](https://badge.fury.io/js/redux-data-dispatch)
[![Build Status](https://travis-ci.org/benjaminhadfield/redux-data-dispatch.svg?branch=master)](https://travis-ci.org/benjaminhadfield/redux-data-dispatch)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

An enhancer to redux reducers that makes it easy to define dependend reducers to store data returned by a single action. This promotes a modular redux design where each reducer is responsible for storing one type of data.

This package works best when used in conjunction with [Normalizr](https://github.com/paularmstrong/normalizr).

## Install

Using npm

```
npm install redux-data-dispatch
```

Or yarn

```
yarn add redux-data-dispatch
```

## Example

We're building an application that lets you search repositories on GitHub.
The search endpoint returns a list of repositories, and each repository contains
data relating to different entities.
In this example, let's assume it returns data for:

 - the repo (e.g. `id`, `name`, `created_on`, `stargazers`, ...)
 - the owner (e.g. `id`, `name`, `url`, ...)

However, we want to keep repo specific data in the `repo` reducer and send
`owner` data to the `owner` reducer.
With **redux data dispatch** this is easy! 🤓

```js
// src/index.js

import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import dataDispatch from 'redux-data-dispatch'

import reducer from './reducer'
import App from './App'

// Setup the store with middleware
const store = createStore(
  reducer,
  undefined,
  applyMiddleware(dataDispatch)
)

// Render the app
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

```js
// src/services/repo/actions.js

// import dataDispatch from index.js
import api from '../api'
import { repo } from './schema'

// action types
export const GET_REPOS_REQUEST = 'GET_REPOS_REQUEST'
export const GET_REPOS_SUCCESS = 'GET_REPOS_SUCCESS'
export const GET_REPOS_FAILURE = 'GET_REPOS_FAILURE'

// action creators
const getReposRequest = () => ({ type: GET_REPOS_REQUEST })
const getReposSuccess = payload => ({ type: GET_REPOS_SUCCESS, payload })
const getReposFailure = payload => ({ type: GET_REPOS_FAILURE, error: true, payload })

// action to get repos from github
export const getRepos = (repoName) => (dispatch) => {
  dispatch(getReposRequest())
  return api({
    url: `https://api.github.com/search/repositories`,
    params: { q: repoName }
  })
    // normalize the response to get response data in shape:
    // {
    //   entities: { repos: {...}, owners: {...} },
    //   result: [...]
    // }
    .then(res => normalize(res.data, { item: [repo] }))
    // dataDispatch will dispatch the `getReposSuccess` action, and make
    // additional dispatches as defined by our dependency mapping
    .then(normalised => dispatch(
      // action to dispatch
      getReposSuccess(normalised),
      // Keys: specify which reducer to also send actions to
      // Values: specify which subset of the action to send in the payload to
      // the reducer
      { owner: 'payload.entities.owners' })
    )
    .catch(err => dispatch(getReposFailure(err)))
}
```

```js
// src/services/owner/reducer.js

import { listenFor } from 'redux-data-dispatch'

const initialState = {
  entities: {},
  order: [],
  error: null,
  loading: false
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    default:
      return state
  }
}

// Identify this reducer as `owner` in dataDispatch
export default listenFor('owner')(reducer)
```

## API

### dataDispatch `function`

```js
import dataDispatch from 'redux-data-dispatch'
```

Supply to `applyMiddleware` to add data dispatch functionality to your app.

##### Example

###### `store.js`

```js
import { applyMiddleware } from 'redux'
import dataDispatch from 'redux-data-dispatch'

applyMiddleware([dataDispatch])
```

###### `actions.js`

```js
// If you want an action to dispatch to other reducers then just add pass an
// object specifying which reducers and payload to call as a second argument
// to dispatch
const doSomething = () => dispatch => {
  dispatch(
    { type: 'FOO', action: { a: 1, b: 2 } },
    { otherReducer: 'action.b' }
  )
}
```

### listenFor `function`

```js
import { listenFor } from 'redux-data-dispatch'
```

##### Arguments

 - `key` <`string`> a key that uniquely identifies this reducer.

##### Returns

Returns a function that accepts the reducer to identify with `key`.

#### Example

```js
import { listenFor } from 'redux-data-dispatch'

const initialState = {
  entities: {}
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    default:
      return state
  }
}

export default listenFor('key-name')(reducer)
```
