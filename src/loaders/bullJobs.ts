import config from '../config';
import Queue from 'bull';
import throng from 'throng';
import {runSyncListJsFile} from "../helpers/file";
import path from "path";
import LoggerInstance from "./logger";
// Connect to a local redis instance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || "redis://:Tuantu123@@45.32.120.55:6379/2";
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');

export default (longJob = true) => {
  return new Promise(async function(resolve, reject) {
    try {
      let queues = [];
      let bullAdapters = [];
      let files: any = await runSyncListJsFile(path.dirname(__dirname) + '/jobQueues');
      for (var i = 0; i < files.length; i++) {
        let worker = require(files[i]).default;
        LoggerInstance.info('[Bull Queue] run file '+files[i]);
        if (worker.status) {
          console.log(worker.queueName)
          let workQueue = new Queue(worker.queueName, REDIS_URL);
          bullAdapters.push(new BullAdapter(workQueue));
          if(longJob){
            workQueue.process(worker.prefetch ? parseInt(worker.prefetch) : 1, worker.run);
            workQueue.on('failed', async function (job, error) {
              console.log(error);
              let newJob = await workQueue.add(job.data, { ...{ priority: 1 }, ...job.opts });
              console.log(`Job-${job.id} failed. Creating new Job-${newJob.id} with highest priority for same data.`);
            });
          }
          queues.push({
            name: worker.queueName,
            queue: workQueue,
          });
        }
      }
      const serverAdapter = new ExpressAdapter();

      createBullBoard({
        queues: bullAdapters,
        serverAdapter
      });
      resolve({queues, serverAdapter});
    }catch (e) {
      reject(e);
    }

  });
// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
//   throng({ workers, start });
};
