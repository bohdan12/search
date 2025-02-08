const cluster = require('cluster');
const os = require('os');
const app = require('./app'); // Import API logic

const PORT = 3000;

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`🟢 Master process running (PID: ${process.pid})`);
  console.log(`🔄 Forking ${numCPUs} workers...\n`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} exited (code: ${code}, signal: ${signal})`);
    console.log(`🔄 Restarting a new worker...\n`);
    cluster.fork();
  });

  // Handle worker messages
  cluster.on('message', (worker, message) => {
    console.log(`📩 Message from worker ${worker.process.pid}:`, message);
  });

} else {
  // Each worker runs the API
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🟢 Worker ${process.pid} listening on port ${PORT}`);
  });

  // Log errors
  server.on('error', (err) => {
    console.error(`❌ Server error in worker ${process.pid}:`, err);
  });

  // Send message to master
  process.send?.(`Worker ${process.pid} is running`);
}
