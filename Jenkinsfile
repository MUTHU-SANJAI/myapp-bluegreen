pipeline {
    agent any

    environment {
        IMAGE_NAME = 'muthusanjai/myapp-bluegreen'
        IMAGE_TAG  = 'latest'  // Change if you want versioned tags
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
                    // --- Safe stop/remove old Blue container ---
                    def blueExists = bat(script: 'docker ps -aq -f "name=myapp-blue"', returnStdout: true).trim()
                    if (blueExists) {
                        echo "Stopping and removing old Blue container..."
                        bat "docker stop myapp-blue"
                        bat "docker rm myapp-blue"
                    } else {
                        echo "No Blue container to remove."
                    }

                    // --- Safe stop/remove old Green container ---
                    def greenExists = bat(script: 'docker ps -aq -f "name=myapp-green"', returnStdout: true).trim()
                    if (greenExists) {
                        echo "Stopping and removing old Green container..."
                        bat "docker stop myapp-green"
                        bat "docker rm myapp-green"
                    } else {
                        echo "No Green container to remove."
                    }

                    // --- Determine inactive environment to deploy ---
                    def activeEnv = bat(script: 'docker ps -q -f "name=myapp-blue"', returnStdout: true).trim() ? "green" : "blue"
                    def port = activeEnv == "blue" ? 8090 : 8091
                    echo "Deploying new version to ${activeEnv} environment on port ${port}..."

                    // --- Run new container ---
                    bat "docker run -d --name myapp-${activeEnv} -p ${port}:8080 -e ENVIRONMENT=${activeEnv} %IMAGE_NAME%:%IMAGE_TAG%"

                    // --- Wait a few seconds for the container to start ---
                    sleep(time:5, unit:"SECONDS")

                    // --- Health check using curl ---
                    def response = bat(script: "curl -s http://localhost:${port}/health", returnStdout: true).trim()
                    echo "Health check response: ${response}"

                    if (!response.contains('"status":"ok"')) {
                        error("New deployment failed health check.")
                    } else {
                        echo "New deployment successful! Environment ${activeEnv} is live."
                    }
                }
            }
        }
    }

    post {
        failure {
            echo "Deployment failed. Check console logs for errors."
        }
        success {
            echo "Deployment pipeline completed successfully!"
        }
    }
}
