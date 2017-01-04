const sinon = require('sinon')

function getParentBehaviour (stubInstance) {
  return (stubInstance.parent && getCurrentBehavior(stubInstance.parent))
}

function getDefaultBehavior (stubInstance) {
  return stubInstance.defaultBehavior ||
          getParentBehaviour(stubInstance) ||
          sinon.behavior.create(stubInstance)
}

function getCurrentBehavior (stubInstance) {
  const behavior = stubInstance.behaviors ? stubInstance.behaviors[stubInstance.callCount - 1] : null
  return behavior && behavior.isPresent() ? behavior : getDefaultBehavior(stubInstance)
}

function wrapInvoke (self, invoke, func, forwardedArgs) {
  if (invoke.name === 'wrapped') {
    return invoke
  }
  const wrapped = (stubFunc, thisValue, args) => {
    const currentBehavior = getCurrentBehavior(self)
    currentBehavior.invoke = wrapInvoke(currentBehavior, currentBehavior.invoke, func, args)
    if (func && currentBehavior !== self.defaultBehavior) {
      func(...(forwardedArgs || args || []))
    }
    if (self.behaviors && self.behaviors.length && self.behaviors[self.callCount]) {
      const behavior = self.behaviors[self.callCount]
      behavior.invoke(stubFunc, thisValue, args)
    }
    return invoke.call(self, stubFunc, thisValue, args)
  }
  return wrapped
}

function calls (func) {
  this.invoke = wrapInvoke(this, this.invoke, func)

  return this
}

sinon.stub.calls = calls
sinon.behavior.calls = calls
