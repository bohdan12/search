const cluster = require('cluster');
const os = require('os');
const app = require('./app'); // Import the API logic

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Por defecto, usa '0.0.0.0'

if (cluster.isMaster) {
  const numCPUs = os.cpus().length || 2; // Asegura al menos 2 workers
  console.log(`🟢 Master process running (PID: ${process.pid})`);
  console.log(`🔄 Forking ${numCPUs} workers...\n`);

  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    console.log(`✅ Worker ${worker.process.pid} started.`);
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} exited with code ${code}`);
    console.log(`🔄 Restarting worker...`);
    cluster.fork();
  });

} else {
  console.log(`👷 Worker ${process.pid} starting...`);

  const server = app.listen(PORT, HOST, () => {
    console.log(`✅ Worker ${process.pid} listening on ${HOST}:${PORT}`);
  });

  server.on('error', (err) => {
    console.error(`❌ Server error in worker ${process.pid}:`, err);
  });
}
