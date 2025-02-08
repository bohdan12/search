const cluster = require('cluster');
const os = require('os');
const app = require('./app'); // Import your API logic

const PORT = 3000;

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`Master process running with PID: ${process.pid}`);
  console.log(`Forking ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} exited. Restarting...`);
    cluster.fork();
  });
} else {
  // Each worker runs the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}
