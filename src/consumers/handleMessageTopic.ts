import { Container } from 'typedi';
import url from 'url';
import { checkDataNull } from '../helpers/object';

export default {
  topic: 'prepareDataToNotify',
  status: true,
  totalConsumer: 10,
  run: async function(message) {
    const Channel = Container.get('ChannelModel');
    return new Promise(async function(resolve, reject) {
      try {
        if (message.channel_id) {
          message.content = message.text;
          message.model_id = message.mode_id || message.id;
          message.model_name = message.model_name || 'messages';
          if (!checkDataNull(message.text_desc)) message.content = message.text_desc;

          if (checkDataNull(message.channel_info)) {
            // @ts-ignore
            let channel = await Channel.findOne({
              channel_id: message.channel_id,
            });
            if (!checkDataNull(channel)) {
              message.channel_info = channel;
            }
          }

          if (checkDataNull(message.sender) || typeof message.sender !== 'object') {
            let sender_id = message.sender_id;
            if (checkDataNull(sender_id)) sender_id = message.sender;
            message.sender = await UserService.findOne(sender_id, message.sender_type);
          }

          if (checkDataNull(message.sender)) resolve({});
          if (checkDataNull(message.channel_info)) resolve({});

          if (checkDataNull(message.text) && message.is_attachment) {
            message.content = 'đã gửi tệp đính kèm';
          } else if (message.has_mention) {
            message.content = message.text_desc;
          }
          if (message.channel_info) {
            message.channel_type = message.channel_info.channel_type;
            message.image = message.channel_info.cover_img;
            message.title = message.channel_info.channel_name;

            if (message.channel_info.channel_type === 'direct') {
              if (typeof message.sender === 'object') {
                message.title = message.sender.fullname || message.sender.name;
                message.image = message.sender.avatar;
              }
            } else if (
              message.channel_info.channel_type === 'group' ||
              message.channel_info.channel_type === 'package'
            ) {
              if (typeof message.sender === 'object') {
                message.content = `${message.sender.fullname}: ${message.content}`;
                message.image = message.sender.avatar;
              }
            } else if (message.channel_info.channel_type === 'thread') {
              let { parent_message = {}, parent_channel = {} } = message.channel_info;
              message.content = `${message.sender.fullname}: ${message.content}`;
              message.title = `${parent_channel.channel_name}`;
              message.content = `'${parent_message.text}' \n ${message.content}`;
            }
          }
          if (message.channel_id) {
            if (message.has_mention && message.mention_all === false) {
              ChannelV2Service.sendNotificationMention(message)
                .then(function(ok) {
                  console.log('done push mention');
                  resolve(ok);
                })
                .catch(function(err) {
                  console.error(err);
                });
            } else {
              let where = {
                channel_id: message.channel_id,
                status: 1,
                is_notification: 1,
              };
              if (typeof message.sender === 'object')
                where.user_id = {
                  '!=': message.sender.id.toString(),
                };
              let skip = 0;
              let limit = 1000;
              let members = await Channelmember.find({
                where,
                select: ['user_id', 'user_type', 'is_notification'],
                skip,
                limit,
              });
              console.log('done members with total ' + members.length);
              console.log(members);

              ChannelV2Service.sendNotificationByMembers(message, members)
                .then(function(ok) {
                  console.log(ok);
                })
                .catch(function(err) {
                  console.error(err);
                });
              resolve(members);
            }
          } else {
            resolve(true);
          }
        } else {
          reject(new Error('not found channel_id'));
        }
      } catch (error) {
        reject(error);
      }
    });
  },
};
