pipeline {
    agent any

    environment {
        IMAGE_NAME = 'muthusanjai/myapp-bluegreen'
        DOCKER_CRED_ID = 'docker-hub-cred' // Docker Hub credentials in Jenkins
        PORT_BLUE = '8081'
        PORT_GREEN = '8082'
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo "Checking out code from GitHub..."
                checkout scm
            }
        }

        stage('Docker Login') {
            steps {
                script {
                    try {
                        withCredentials([
                            usernamePassword(
                                credentialsId: env.DOCKER_CRED_ID,
                                usernameVariable: 'DOCKER_USER',
                                passwordVariable: 'DOCKER_PASS'
                            )
                        ]) {
                            bat 'echo %DOCKER_PASS% | docker login --username %DOCKER_USER% --password-stdin'
                        }
                    } catch (err) {
                        echo "Docker Hub credentials not found, skipping login."
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                bat "docker build -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    try {
                        withCredentials([
                            usernamePassword(
                                credentialsId: env.DOCKER_CRED_ID,
                                usernameVariable: 'DOCKER_USER',
                                passwordVariable: 'DOCKER_PASS'
                            )
                        ]) {
                            echo "Pushing Docker image to Docker Hub..."
                            bat "docker push ${IMAGE_NAME}:latest"
                        }
                    } catch (err) {
                        echo "Skipping push because Docker credentials are missing."
                    }
                }
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    // Detect active container
                    def activeContainer = bat(
                        script: 'docker ps --filter "name=myapp-" --format "{{.Names}}"',
                        returnStdout: true
                    ).trim()

                    def inactiveContainer = ''
                    def port = ''

                    if (activeContainer.contains('myapp-blue')) {
                        inactiveContainer = 'myapp-green'
                        port = PORT_GREEN
                    } else {
                        inactiveContainer = 'myapp-blue'
                        port = PORT_BLUE
                    }

                    echo "Deploying new version to inactive container: ${inactiveContainer} on port ${port}"

                    // Remove existing inactive container
                    bat "docker rm -f ${inactiveContainer} || echo No existing container"

                    // Start new inactive container
                    bat "docker run -d --name ${inactiveContainer} -p ${port}:8080 ${IMAGE_NAME}:latest"

                    echo "Deployment complete. Switch traffic to ${inactiveContainer} manually or via load balancer."
                }
            }
        }

        // --- Modified Health Check ---
        stage('Health Check') {
            steps {
                script {
                    // Determine which container and port was deployed in previous stage
                    def activeContainer = bat(
                        script: 'docker ps --filter "name=myapp-" --format "{{.Names}}"',
                        returnStdout: true
                    ).trim()
                    
                    def containerName = ''
                    def port = ''
                    if (activeContainer.contains('myapp-blue')) {
                        containerName = 'myapp-blue'
                        port = PORT_BLUE
                    } else {
                        containerName = 'myapp-green'
                        port = PORT_GREEN
                    }

                    echo "Checking ${containerName} on port ${port}..."

                    def maxRetries = 5
                    def success = false

                    for (int i = 1; i <= maxRetries; i++) {
                        echo "Attempt ${i}..."

                        // Use curl to get only the HTTP status code
                        def status = bat(
                            script: "curl -s -o NUL -w %%{http_code} http://localhost:${port}",
                            returnStdout: true
                        ).trim()

                        echo "HTTP status: ${status}"

                        if (status == '200') {
                            echo "${containerName} is healthy!"
                            success = true
                            break
                        } else {
                            echo "Not ready yet, retrying in 5s..."
                            sleep 5
                        }
                    }

                    if (!success) {
                        error "${containerName} failed health check!"
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
            echo "Deployment failed. Check logs."
        }
    }
}
