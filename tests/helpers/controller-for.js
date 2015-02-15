import Ember from 'ember';

Ember.Test.registerHelper('controllerFor', function (app, name) {
  return app.__container__.lookup('controller:' + name);
});
