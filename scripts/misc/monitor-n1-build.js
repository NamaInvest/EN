const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  // Monitor build and restart after completion
  const cmd = `
    echo "=== Build status ==="
    # Check if build is still running
    if [ -f /tmp/n1_build_pid.txt ]; then
      PID=$(cat /tmp/n1_build_pid.txt)
      if kill -0 $PID 2>/dev/null; then
        echo "Build still running (PID: $PID)"
        # Show last 20 lines of build log
        tail -20 /tmp/n1_theme_build.log 2>/dev/null
      else
        echo "Build completed!"
        # Check if build succeeded
        if tail -5 /tmp/n1_theme_build.log 2>/dev/null | grep -q "Route (app)"; then
          echo "✅ Build SUCCESS"
          # Restart n1
          pm2 restart n1-main && echo "✅ n1-main restarted"
          # Wait for it to come up
          sleep 3
          # Verify theme switcher in built output
          grep -l "inline-block" /www/wwwroot/n1.namainvist.com/.next/server/chunks/*.js 2>/dev/null | head -2 && echo "✅ New ThemeSwitcher in build" || echo "(checking other way)"
          pm2 status n1-main | grep -E "status|↺"
        else
          echo "❌ Build may have failed"
          tail -30 /tmp/n1_theme_build.log 2>/dev/null
        fi
      fi
    else
      echo "No build PID file found"
    fi
    
    echo ""
    echo "=== Last 15 lines of build log ==="
    tail -15 /tmp/n1_theme_build.log 2>/dev/null
  `;
  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
