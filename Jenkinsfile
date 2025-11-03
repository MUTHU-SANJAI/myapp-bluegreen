pipeline {
    agent any

    environment {
        // Docker Hub credentials ID added in Jenkins
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE = "${DOCKERHUB_CREDENTIALS_USR}/myapp-bluegreen"
    }

    stages {
        stage('Checkout') {
            steps {
                // Replace with your actual GitHub username and public repo URL
                git branch: 'main', url: 'https://github.com/MUTHU-SANJAI/myapp-bluegreen.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build a Docker image with the build number as a tag
                    dockerImage = docker.build("${DOCKER_IMAGE}:${BUILD_NUMBER}")
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    // Push Docker image to Docker Hub
                    docker.withRegistry('', 'dockerhub-credentials') {
                        dockerImage.push("${BUILD_NUMBER}")
                        dockerImage.push("latest")
                    }
                }
            }
        }

       stage('Blue-Green Deploy') {
    steps {
        script {
            // Check active environment
            def activeContainer = bat(script: "docker ps --filter \"name=myapp-\" --format \"{{.Names}}\" | head -n 1", returnStdout: true).trim()
            def newEnv = activeContainer.contains('blue') ? 'green' : 'blue'

            echo "Deploying new version to ${newEnv} environment..."

            // Run new container
            bat """
                docker run -d --name myapp-${newEnv} -p ${newEnv == 'blue' ? '8080:8080' : '8081:8080'} -e ENVIRONMENT=${newEnv} ${DOCKER_IMAGE}:${BUILD_NUMBER}
            """

            // Wait and health check
            sleep 5

            def healthCheck = bat(script: "curl -s http://localhost:${newEnv == 'blue' ? '8080' : '8081'}", returnStatus: true)

            if (healthCheck == 0) {
                echo "✅ ${newEnv} environment healthy. Switching traffic..."
                if (activeContainer) {
                    bat "docker stop ${activeContainer} && docker rm ${activeContainer}"
                }
            } else {
                error("❌ New deployment failed health check.")
            }
        }
    }
}


    post {
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed. Check console output for details."
        }
    }
}
