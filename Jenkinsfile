stage('Health Check') {
    steps {
        script {
            // Determine inactive container and port
            def activeContainer = bat(
                script: 'docker ps --filter "name=myapp-" --format "{{.Names}}"',
                returnStdout: true
            ).trim()
            
            def inactiveContainer = 'myapp-blue'
            def port = PORT_BLUE
            if (activeContainer.contains('myapp-blue')) {
                inactiveContainer = 'myapp-green'
                port = PORT_GREEN
            }

            echo "Waiting for ${inactiveContainer} to start on port ${port}..."

            // Retry loop: check every 5 seconds, max 10 attempts
            def maxRetries = 10
            def sleepSeconds = 5
            def success = false

            for (int i = 0; i < maxRetries; i++) {
                echo "Checking if container is responding (attempt ${i + 1}/${maxRetries})..."
                
                // Windows-friendly curl command to get HTTP status code
                def result = bat(
                    script: "curl -s -o NUL -w \"%{http_code}\" \"http://localhost:${port}\"",
                    returnStdout: true
                ).trim()

                if (result == '200') {
                    echo "${inactiveContainer} is running successfully!"
                    success = true
                    break
                } else {
                    echo "Container not ready yet (status: ${result}), retrying in ${sleepSeconds} seconds..."
                    sleep sleepSeconds
                }
            }

            if (!success) {
                error "Health check failed for ${inactiveContainer} after ${maxRetries} attempts"
            }
        }
    }
}
