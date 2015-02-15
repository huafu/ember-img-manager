import Ember from 'ember';

Ember.Test.registerAsyncHelper('later', function(app, delay) {
  Ember.run.later(Ember, 'K', delay);
});
