export default {
  queueName: 'test22',
  run: function(msg, cb) {
    console.log('vao');
    cb(true);
  },
};
