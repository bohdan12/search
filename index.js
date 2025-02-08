const cluster = require('cluster');
const os = require('os');
const app = require('./app'); // Import your server logic

const PORT = 3000;

if (cluster.isMaster) {
  // Number of CPU cores
  const numCPUs = os.cpus().length;

  console.log(`Master process running with PID: ${process.pid}`);
  console.log(`Forking ${numCPUs} workers...`);

  // Fork a worker for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exits and restart them
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker with PID: ${worker.process.pid} exited.`);
    console.log('Starting a new worker...');
    cluster.fork();
  });
} else {
   const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Worker running on port ${PORT} with PID: ${process.pid}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });
}
