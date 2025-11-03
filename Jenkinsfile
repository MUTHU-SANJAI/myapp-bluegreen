pipeline {
    agent any

    environment {
        DOCKER_USER = 'muthusanjai'
        DOCKER_PASSWORD = 'sNCByxHR$Tw9eb!'
        IMAGE_NAME = 'muthusanjai/myapp-bluegreen:latest'
        PORT = '8080'
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo "Checking out code from GitHub..."
                checkout([$class: 'GitSCM', branches: [[name: '*/main']],
                          userRemoteConfigs: [[url: 'https://github.com/MUTHU-SANJAI/myapp-bluegreen']]])
            }
        }

        stage('Docker Login') {
            steps {
                echo "Logging in to Docker Hub..."
                bat "echo ${DOCKER_PASSWORD} | docker login --username ${DOCKER_USER} --password-stdin"
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                bat "docker build -t ${IMAGE_NAME} ."
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "Pushing Docker image to Docker Hub..."
                bat "docker push ${IMAGE_NAME}"
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    echo "Determining active container..."
                    def activeContainer = bat(returnStdout: true, script: 'docker ps --filter "name=myapp-blue" --format "{{.Names}}"').trim()
                    echo "Active container: ${activeContainer}"

                    // Determine inactive container
                    def inactiveContainer = (activeContainer == "myapp-blue" || activeContainer == "") ? "myapp-green" : "myapp-blue"
                    echo "Deploying new version to inactive container: ${inactiveContainer}"

                    // Remove inactive container if exists
                    bat """
                    docker rm -f ${inactiveContainer} || echo No existing container
                    docker run -d --name ${inactiveContainer} -p ${PORT}:${PORT} ${IMAGE_NAME}
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "Performing health check..."
                    def statusCode = bat(returnStatus: true, script: "curl -s -o nul -w \"%{http_code}\" http://localhost:${PORT}/") 
                    if (statusCode != 200) {
                        error "Health check failed! Status code: ${statusCode}"
                    } else {
                        echo "Health check passed!"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
        success {
            echo "Deployment succeeded!"
        }
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
}
