pipeline {
    // This defines the default agent for the whole pipeline, 
    // unless a specific stage overrides it.
    agent any 

    stages {
        stage('Preparation') {
            steps {
                git branch: 'main', url: 'https://github.com/VincentYuann/Food-Finder.git'
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                    echo "Without Docker"
                    ls -l
                    ls -a
                '''
            }
        }
        
        stage('Results') {
            // This stage overrides the default agent and runs entirely inside Node 18!
            agent {
                docker {
                    image "node:18-alpine"
                }
            }
            steps {
                sh 'node -v'
                sh 'echo "With Docker"'
            }
        }
    }
}