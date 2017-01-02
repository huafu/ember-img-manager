import Ember from 'ember';
import startApp from '../../helpers/start-app';

var application;

module('Acceptance: should render a simple image', {
  setup:    function () {
    application = startApp();
  },
  teardown: function () {
    Ember.run(application, 'destroy');
  }
});

test('visiting /img-wrap/simple', function () {
  var $imgContainer;
  visit('/img-wrap/simple');
  andThen(function(){
    later(10);
  });
  andThen(function () {
    equal(currentPath(), 'img-wrap.simple');
    $imgContainer = find('.img-container');
    equal($imgContainer.find('img').attr('src'), 'assets/images/cartoon-1.jpg');
    equal($imgContainer.find('img').attr('alt'), 'Cartoon 1');
  });
});
