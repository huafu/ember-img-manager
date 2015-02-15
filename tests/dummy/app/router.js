import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('img-wrap', function(){
    this.route('simple');
    this.route('delayed-src');
    this.route('switch-src');
  });
});

export default Router;
