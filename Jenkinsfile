pipeline {
    agent any

    environment {
        IMAGE_NAME = 'muthusanjai/myapp-bluegreen'
        IMAGE_TAG  = 'latest'
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Cloning repository..."
                git branch: 'main',
                    url: 'https://github.com/MUTHU-SANJAI/myapp-bluegreen.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                bat "docker build -t %IMAGE_NAME%:%IMAGE_TAG% ."
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    // --- Stop & remove Blue container safely ---
                    bat """
                    for /f "tokens=*" %%i in ('docker ps -aq -f "name=myapp-blue"') do (
                        docker stop %%i || exit /b 0
                        docker rm %%i || exit /b 0
                    )
                    """

                    // --- Stop & remove Green container safely ---
                    bat """
                    for /f "tokens=*" %%i in ('docker ps -aq -f "name=myapp-green"') do (
                        docker stop %%i || exit /b 0
                        docker rm %%i || exit /b 0
                    )
                    """

                    // --- Determine inactive environment ---
                    def activeEnv = bat(script: 'docker ps -q -f "name=myapp-blue"', returnStdout: true).trim() ? "green" : "blue"
                    def port = activeEnv == "blue" ? 8090 : 8091
                    echo "Deploying new version to ${activeEnv} environment on port ${port}..."

                    // --- Run new container ---
                    bat "docker run -d --name myapp-${activeEnv} -p ${port}:8080 -e ENVIRONMENT=${activeEnv} %IMAGE_NAME%:%IMAGE_TAG%"

                    // --- Wait for container to start ---
                    sleep(time:5, unit:"SECONDS")

                    // --- Health check ---
                    def response = bat(script: "curl -s http://localhost:${port}/health", returnStdout: true).trim()
                    echo "Health check response: ${response}"

                    if (!response.contains('"status":"ok"')) {
                        error("New deployment failed health check.")
                    } else {
                        echo "Deployment successful! Environment ${activeEnv} is live."
                    }
                }
            }
        }
    }

    post {
        failure {
            echo "Deployment failed. Check logs for details."
        }
        success {
            echo "Blue-Green deployment completed successfully!"
        }
    }
}
