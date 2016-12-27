const sinon = require('sinon')

function matchingFake (fakes, args, strict) {
  if (!fakes) {
    return undefined
  }

  for (let i = 0, l = fakes.length; i < l; i++) {
    if (fakes[i].matches(args, strict)) {
      return fakes[i]
    }
  }
}

function wrapInvoke (self, invoke, func, ix) {
  return (stubFunc, thisValue, args) => {
    if (func) {
      func(...(args || []))
    }
    let result
    /*if (self.fakes) {
      const matching = matchingFake(self.fakes, args)
      if (matching) {
        result = matching.invoke(stubFunc, thisValue, args)
      } else {
        result = invoke.call(self, stubFunc, thisValue, args)
      }
    } else {*/
      result = invoke.call(self, stubFunc, thisValue, args)
    //}
    return result
  }
}

function calls (func) {
  this.invoke = wrapInvoke(this, this.invoke, func)
  if (this.stub) {
    for (let i = 0; i < this.stub.behaviors.length; i++) {
      const b = this.stub.behaviors[i]
      if (b) {
        b.invoke = wrapInvoke(b, b.invoke, func)
      }
    }
  }

  return this
}

sinon.stub.calls = calls
sinon.behavior.calls = calls
