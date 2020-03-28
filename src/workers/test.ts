export default {
  queueName: 'test',
  run: function(msg, cb) {
    console.log('vao');
    cb(true);
  },
};
