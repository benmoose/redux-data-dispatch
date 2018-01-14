# Reux Data Dispatch

[![npm version](https://img.shields.io/npm/v/redux-data-dispatch.svg?style=flat-square)](https://badge.fury.io/js/redux-data-dispatch)
[![Build Status](https://travis-ci.org/benjaminhadfield/redux-data-dispatch.svg?branch=master)](https://travis-ci.org/benjaminhadfield/redux-data-dispatch)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

An enhancer to redux reducers that makes it easy to define dependent reducers to store data returned by a single action. This promotes a modular redux design where each reducer is responsible for storing one type of data.

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

###### `index.js`

```js
import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import dataDispatch from 'redux-data-dispatch'

import reducer from './reducer'
import App from './App'

// Setup the store with middleware
const store = (initialState) => createStore(
  reducer,
  initialState,
  applyMiddleware(dataDispatch)
)

// Render the app
ReactDOM.render(
  <Provider store={store()}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

###### `repo/actions.js`

```js
import axios from 'axios'
import { repo } from './schema'

// action types
export const GET_REPOS_REQUEST = 'GET_REPOS_REQUEST'
export const GET_REPOS_SUCCESS = 'GET_REPOS_SUCCESS'
export const GET_REPOS_FAILURE = 'GET_REPOS_FAILURE'

// action to search github repos
export const getRepos = (repoName) => (dispatch) => {
  dispatch({ type: GET_REPOS_REQUEST })
  return axios.get('https://api.github.com/search/repositories', {
    params: { q: repoName }
  })
    .then(res => (
      // normalize the response to get response data in shape:
      // {
      //   entities: { repos: {...}, owners: {...} },
      //   result: [...]
      // }
      normalize(res.data, { item: [repo] }))
    )
    .then(normalised => dispatch({
      // dispatch the action as normal...
      type: GET_REPOS_SUCCESS,
      payload: normalised,
      // ...and to send to other reducers, just add a `deps` key
      // to the `action.meta` object
      meta: {
        // keys:   specify which reducer to send an action to
        // values: select which data in this action to send
        deps: { owner: 'payload.entities.owners' }
      }
    }))
    .catch(err => dispatch({
      type: GET_REPOS_FAILURE,
      payload: err,
      error: true
    }))
}
```

###### `owner/reducer.js`

```js
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

### `dataDispatch` `<function>`

```js
import dataDispatch from 'redux-data-dispatch'
```

Supply to `applyMiddleware` to add data dispatch functionality to your app.

#### Example

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
  dispatch({
    type: 'FOO',
    payload: { a: 1, b: 2 },
    meta: {
      deps: { reducerKey: 'payload.b' }
      // ...or: deps: { reducerKey: action => action.payload.b }
    }
  })
}
```

### `listenFor` `<function>`

```js
import { listenFor } from 'redux-data-dispatch'
```

#### Arguments

 - **`key`** `<string>`: a key that uniquely identifies this reducer.

#### Returns

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
