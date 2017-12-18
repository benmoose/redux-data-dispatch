# Reux Data Dispatch

[![Build Status](https://travis-ci.org/benjaminhadfield/redux-data-dispatch.svg?branch=master)](https://travis-ci.org/benjaminhadfield/redux-data-dispatch)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

An enhancer to redux reducers that makes it easy to define dependend reducers to store data returned by a single action. This promotes a modular redux design where each reducer is responsible for storing one type of data.

This package assumes you work with `normalizr`.

## Install

Using npm
```
npm install redux-data-dispatch
```

...or yarn
```
yarn add redux-data-dispatch
```

## Usage

Lets assume we're building an application that lets you search repositories on GitHub.
The search endpoint returns a list of repositories, and each repository contains
data relating to different entities. In this example, let's assume it returns data for:

 - the repo (e.g. `id`, `name`, `created_on`, `stargazers`, ...)
 - the owner (e.g. `id`, `name`, `url`, ...)

However, we want to keep repo specific data in the `repo` reducer and send
`owner` data to the `owner` reducer.
With **redux data dispatch** this is easy! 🤓

Firstly, we create an `owner` reducer and connect it to data dispatch by defining
a `key` and then passing the reducer. In this case the key is `'owner'`.

`owner/reducer.js`

```js
import { listenFor } from 'redux-data-dispatch'

const reducer = (state = {}, action) => {
  switch(action.type) {
    default:
      return state
  }
}

// Connect with a key and the reducer
export default listenFor('owner')(reducer)
```

Then in the repo actions file, we create the function that calls GitHub's search api.
The result contains a mix of `repo` and `owner` data.

We normalize the response using normalizr, then define the reducer dependencies.

`repo/actions.js`

```js
import axios from 'axios'
import configureDataDispatch from 'redux-data-dispatch'
import { normalize, schema } from 'normalizr'
import { store } from '../store.js'

// Setup with your store
const dataDispatch = configureDataDispatch(store)

// Define action creators
export const repoSearchSuccess = (payload) => ({
  type: 'REPO_SEARCH_SUCCESS',
  payload
})

// Define the api response schema (normalizr)
const owner = new schema.Entity('owners')
const repo = new schema.Entity('repos', { owner })

// Define the search action
export const searchRepos = (search) => (dispatch) => {
  return axios.get('https://api.github.com/search/repositories', {
    params: {
      q: search
    }
  })
    // Normalize to an object with shape:
    // {
    //   entities: { repos: {...}, owners: {...} },
    //   result: { order: [...] }
    // }
    .then(res => normalize(res.data.items, [ repo ]))
    // Create the action...
    .then(res => repoSearchSuccess(res))
    // Dispatch the `repoSearchSuccess`.
    // Additionally, dispatch an action that will be
    // picked up by the reducer with the key `owner`.
    // The payload of that action will be, in this case,
    // `payload.entities.owners`.
    .then(res => dataDispatch(res, {
      owner: 'payload.entities.owners'
    }))
}
```
