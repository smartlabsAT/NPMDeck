#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Development mode - can be 'simple' or 'fullstack'
DEV_MODE=${DEV_MODE:-simple}
CONTAINER_NAME="npm2dev.simple"
SERVICE_NAME="simple"

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to set mode
set_mode() {
    if [ "$1" = "simple" ]; then
        DEV_MODE="simple"
        CONTAINER_NAME="npm2dev.simple"
        SERVICE_NAME="simple"
        print_color $GREEN "✅ Switched to SIMPLE mode (SQLite-based NPM)"
    elif [ "$1" = "fullstack" ]; then
        DEV_MODE="fullstack"
        CONTAINER_NAME="npm2dev.fullstack"
        SERVICE_NAME="fullstack"
        print_color $GREEN "✅ Switched to FULLSTACK mode (Complex setup with all services)"
    else
        print_color $RED "❌ Invalid mode. Use 'simple' or 'fullstack'"
        return 1
    fi
}

# Function to check if container is running
check_container_status() {
    if docker ps | grep -q "$CONTAINER_NAME"; then
        return 0
    else
        return 1
    fi
}

# Function to show container status
show_status() {
    print_color $CYAN "\n📊 Container Status ($DEV_MODE mode):"
    if check_container_status; then
        print_color $GREEN "✅ Container $CONTAINER_NAME is running"
        print_color $BLUE "\n🌐 Access URLs:"
        print_color $YELLOW "   Admin UI:           http://localhost:4071"
        if [ "$DEV_MODE" = "simple" ]; then
            print_color $YELLOW "   Default Login:      admin@example.com / changeme"
            print_color $YELLOW "   New Frontend:       http://localhost:4073"
        fi
        if [ "$DEV_MODE" = "fullstack" ]; then
            print_color $YELLOW "   New Frontend:       http://localhost:4073"
        fi
        print_color $YELLOW "   HTTP Proxy:         http://localhost:4070"
        print_color $YELLOW "   HTTPS Proxy:        https://localhost:4072"
    else
        print_color $RED "❌ Container $CONTAINER_NAME is not running"
    fi
}

# Function to check if image exists
check_image_exists() {
    if docker images | grep -q "npm2dev.*fullstack"; then
        return 0
    else
        return 1
    fi
}

# Function to build image
build_image() {
    print_color $CYAN "\n🔨 Building Docker image (this may take a few minutes)..."
    cd docker
    docker-compose -f docker-compose.dev.yml build
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "\n✅ Image built successfully!"
        return 0
    else
        print_color $RED "\n❌ Failed to build image"
        return 1
    fi
    cd ..
}

# Function to start container
start_container() {
    # Check if image exists (only for fullstack mode)
    if [ "$DEV_MODE" = "fullstack" ] && ! check_image_exists; then
        print_color $YELLOW "\n⚠️  Docker image not found. Building first..."
        if ! build_image; then
            return 1
        fi
    fi
    
    print_color $CYAN "\n🚀 Starting $DEV_MODE development container..."
    cd docker
    if [ "$DEV_MODE" = "simple" ]; then
        docker-compose -f docker-compose.dev.yml up -d $SERVICE_NAME frontend-new
    else
        docker-compose -f docker-compose.dev.yml up -d
    fi
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "\n✅ Container started successfully!"
        print_color $YELLOW "\n⏳ Waiting for services to be ready..."
        sleep 5
        show_status
    else
        print_color $RED "\n❌ Failed to start container"
    fi
    cd ..
}

# Function to stop container
stop_container() {
    print_color $CYAN "\n🛑 Stopping development container..."
    cd docker
    if [ "$DEV_MODE" = "simple" ]; then
        docker-compose -f docker-compose.dev.yml stop $SERVICE_NAME frontend-new
        docker-compose -f docker-compose.dev.yml rm -f $SERVICE_NAME frontend-new
    else
        docker-compose -f docker-compose.dev.yml down
    fi
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "\n✅ Container stopped successfully!"
    else
        print_color $RED "\n❌ Failed to stop container"
    fi
    cd ..
}

# Function to restart container
restart_container() {
    print_color $CYAN "\n🔄 Restarting development container..."
    stop_container
    start_container
}

# Function to show logs
show_logs() {
    print_color $CYAN "\n📋 Select log output:"
    echo "1) All logs"
    echo "2) Backend logs only"
    echo "3) Frontend (legacy) logs only"
    echo "4) Frontend (new) logs only"
    echo "5) Last 100 lines of all logs"
    echo "6) Back to main menu"
    
    read -p "Enter your choice: " log_choice
    
    cd docker
    case $log_choice in
        1)
            print_color $CYAN "\n📜 Showing all logs (Ctrl+C to exit)..."
            docker-compose -f docker-compose.dev.yml logs -f
            ;;
        2)
            print_color $CYAN "\n📜 Showing backend logs (Ctrl+C to exit)..."
            docker-compose -f docker-compose.dev.yml exec $SERVICE_NAME tail -f /data/logs/default.log
            ;;
        3)
            if [ "$DEV_MODE" = "fullstack" ]; then
                print_color $CYAN "\n📜 Showing frontend (legacy) logs (Ctrl+C to exit)..."
                docker-compose -f docker-compose.dev.yml logs -f $SERVICE_NAME | grep frontend
            else
                print_color $YELLOW "\n⚠️  This option is only available in fullstack mode"
            fi
            ;;
        4)
            if [ "$DEV_MODE" = "fullstack" ]; then
                print_color $CYAN "\n📜 Showing frontend (new) logs (Ctrl+C to exit)..."
                docker-compose -f docker-compose.dev.yml logs -f $SERVICE_NAME | grep frontend-new
            else
                print_color $YELLOW "\n⚠️  This option is only available in fullstack mode"
            fi
            ;;
        5)
            print_color $CYAN "\n📜 Showing last 100 lines..."
            docker-compose -f docker-compose.dev.yml logs --tail=100
            ;;
        6)
            return
            ;;
        *)
            print_color $RED "Invalid option"
            ;;
    esac
    cd ..
}

# Function to rebuild container
rebuild_container() {
    print_color $CYAN "\n🔨 Rebuilding development container..."
    cd docker
    docker-compose -f docker-compose.dev.yml build --no-cache
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "\n✅ Container rebuilt successfully!"
        print_color $CYAN "\n🚀 Starting newly built container..."
        docker-compose -f docker-compose.dev.yml up -d
        sleep 5
        show_status
    else
        print_color $RED "\n❌ Failed to rebuild container"
    fi
    cd ..
}

# Function to open shell in container
open_shell() {
    if check_container_status; then
        print_color $CYAN "\n🐚 Opening shell in container..."
        docker exec -it $CONTAINER_NAME /bin/bash
    else
        print_color $RED "\n❌ Container is not running. Please start it first."
    fi
}

# Main menu
show_menu() {
    echo
    print_color $PURPLE "╔══════════════════════════════════════════╗"
    print_color $PURPLE "║   NPM Development Environment Manager    ║"
    print_color $PURPLE "╚══════════════════════════════════════════╝"
    
    print_color $CYAN "\n🔧 Current Mode: $DEV_MODE"
    
    show_status
    
    print_color $CYAN "\n📋 Main Menu:"
    echo "1) Start container"
    echo "2) Stop container"
    echo "3) Restart container"
    echo "4) Show logs"
    echo "5) Container status"
    echo "6) Rebuild container"
    echo "7) Open shell in container"
    echo "8) Switch mode (simple/fullstack)"
    echo "9) Exit"
}

# Main loop
while true; do
    show_menu
    read -p $'\nEnter your choice: ' choice
    
    case $choice in
        1)
            if check_container_status; then
                print_color $YELLOW "\n⚠️  Container is already running!"
            else
                start_container
            fi
            ;;
        2)
            if check_container_status; then
                stop_container
            else
                print_color $YELLOW "\n⚠️  Container is not running!"
            fi
            ;;
        3)
            restart_container
            ;;
        4)
            show_logs
            ;;
        5)
            show_status
            ;;
        6)
            rebuild_container
            ;;
        7)
            open_shell
            ;;
        8)
            print_color $CYAN "\n🔄 Switch mode:"
            echo "1) Simple mode (SQLite-based NPM)"
            echo "2) Fullstack mode (Complex setup)"
            read -p "Enter your choice: " mode_choice
            case $mode_choice in
                1)
                    if check_container_status && [ "$DEV_MODE" != "simple" ]; then
                        print_color $YELLOW "\n⚠️  Please stop the current container first"
                    else
                        set_mode "simple"
                    fi
                    ;;
                2)
                    if check_container_status && [ "$DEV_MODE" != "fullstack" ]; then
                        print_color $YELLOW "\n⚠️  Please stop the current container first"
                    else
                        set_mode "fullstack"
                    fi
                    ;;
                *)
                    print_color $RED "Invalid option"
                    ;;
            esac
            ;;
        9)
            print_color $GREEN "\n👋 Goodbye!"
            exit 0
            ;;
        *)
            print_color $RED "\n❌ Invalid option. Please try again."
            ;;
    esac
    
    if [ "$choice" != "9" ]; then
        echo
        read -p "Press Enter to continue..."
    fi
done