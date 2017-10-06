function chain (funcs) {
  return funcs.reduce((promise, func) => promise.then(func), Promise.resolve())
}

function delay (expect, ms = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        expect()
        return resolve()
      } catch (err) {
        return reject(err)
      }
    }, ms)
  })
}

module.exports = {chain, delay}
