workflow "Test" {
  on = "push"
  resolves = ["test", "coverage", "lint"]
}

workflow "Publish" {
  on = "release"
  resolves = ["publish"]
}

action "deps" {
  uses = "actions/npm@master"
  args = "ci"
}

action "test" {
  needs = "deps"
  uses = "actions/npm@master"
  args = "test"
}

action "coverage" {
  needs = "deps"
  uses = "actions/npm@master"
  args = "run coverage"
}

action "deps" {
  needs = "deps"
  uses = "actions/npm@master"
  args = "run lint"
}

action "publish" {
  uses = "actions/npm@master"
  args = "publish"
  secrets = ["NPM_AUTH_TOKEN"]
}
