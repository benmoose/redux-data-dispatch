# Reux Data Dispatch

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
import { Provider } from 'react-redux'
import configureDataDispatch from 'redux-data-dispatch'

import createStore from './store'
import App from './App'

// Setup the store and dataDispatch
const store = createStore()
export const dataDispatch = configureDataDispatch(store)

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
import { dataDispatch } from '../../index'
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
    // additional dispatches as defined by our dependency mapping.
    .then(normalized => {
      dataDispatch(
        // action to dispatch
        getReposSuccess(normalized),
        // make dispatch that is picked up by `owner` reducer. Action has payload
        // set to value of the original action's `payload.entities.owners`
        // property.
        { owner: 'payload.entities.owners' }
      ))
    }
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

// Now calls the list `owner` as a dependency will recieve the specified payload
// Currently, the action payload is just merged with '<reducer>.entities', future
// versions will let you customise this.
// Note, `owner` must match the dependency key defined in the `dataDispatch` call
export default listenFor('owner')(reducer)
```

## API

#### configureDataDispatch `function`

```js
import configureDataDispatch from 'redux-data-dispatch'
```

##### Arguments

 - `store` <`object`> instance of your redux store

##### Returns

Returns a function that takes an action and a reducer dependency mapping and dispatches
relevent actions. The function returns the original action.

Dependency mapping has reducer keys as values and a `string` or `function` type as a value. The value should be a dotted string that selects a property from the action to be the payload of the dependency action. Or can be a function that accepts the action as a parameter and returns any value to be the payload.

e.g. `{ user: 'payload.entities.users' }` or `{ user: action => action.payload.entities.users }`.

##### Example

```js
import configureDataDispatch from 'redux-data-disaptch'
import createStore from './store'

// Setup the store and dataDispatch
const store = createStore()
// Setup dataDispatch
const dataDispatch = configureDataDispatch(store)
```

#### listenFor `function`

```js
import { listenFor } from 'redux-data-dispatch'
```

##### Arguments

 - `key` <`string`> a key that uniquely identifies this reducer.

##### Returns

Returns a function that accepts the reducer to connect to.

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
