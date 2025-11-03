pipeline {
    agent any

    environment {
        IMAGE_NAME = 'muthusanjai/myapp-bluegreen'
        LOCAL_IMAGE_TAG = 'local'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/MUTHU-SANJAI/myapp-bluegreen.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat "docker build -t %IMAGE_NAME%:%LOCAL_IMAGE_TAG% ."
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    // Check if Blue container exists
                    def blueExists = bat(script: 'docker ps -aq -f "name=myapp-blue"', returnStdout: true).trim()
                    if (blueExists) {
                        bat "docker stop myapp-blue"
                        bat "docker rm myapp-blue"
                    }

                    // Check if Green container exists
                    def greenExists = bat(script: 'docker ps -aq -f "name=myapp-green"', returnStdout: true).trim()
                    if (greenExists) {
                        bat "docker stop myapp-green"
                        bat "docker rm myapp-green"
                    }

                    // Decide which environment to deploy
                    def activeEnv = bat(script: 'docker ps -q -f "name=myapp-blue"', returnStdout: true).trim() ? "green" : "blue"
                    def port = activeEnv == "blue" ? 8090 : 8091

                    echo "Deploying new version to ${activeEnv} environment on port ${port}"

                    // Run the container
                    bat "docker run -d --name myapp-${activeEnv} -p ${port}:8080 -e ENVIRONMENT=${activeEnv} %IMAGE_NAME%:%LOCAL_IMAGE_TAG%"

                    // Wait a few seconds for app to start
                    sleep(time:5, unit:"SECONDS")

                    // Health check
                    def response = bat(script: "powershell -Command \"Invoke-WebRequest http://localhost:${port}/health -UseBasicParsing | Select-Object -ExpandProperty Content\"", returnStdout: true).trim()
                    if (!response.contains('"status":"ok"')) {
                        error("New deployment failed health check.")
                    } else {
                        echo "New deployment successful! Environment ${activeEnv} is live."
                    }
                }
            }
        }
    }
}
