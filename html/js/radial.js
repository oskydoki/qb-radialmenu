"use strict";

class RadialMenu {
    constructor() {
        this.menuItems = [];
        this.radius = 200;
        this.isOpen = false;
        this.activeMenuData = null;
        this.wrapper = document.querySelector('.radialmenu-wrapper');
        this.menuElement = document.getElementById('radialmenu');
        this.centerButton = document.getElementById('closeButton');
        
        this.init();
    }

    init() {
        // Event listener for the close button
        this.centerButton.addEventListener('click', () => {
            this.close();
        });

        // Event listener for ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Disable context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    open(menuData) {
        if (this.isOpen) return;
        
        this.activeMenuData = menuData;
        this.isOpen = true;
        this.menuElement.style.display = 'block';
        
        // Clear existing menu items
        while (this.wrapper.querySelector('.menu-item')) {
            this.wrapper.removeChild(this.wrapper.querySelector('.menu-item'));
        }
        
        // Create menu items
        this.createMenuItems(menuData);
        
        // Position items in a circle
        this.positionMenuItems();
    }

    createMenuItems(menuData) {
        if (!menuData || !menuData.length) return;
        
        menuData.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item animate';
            
            // Add blue class if specified
            if (item.color === 'blue') {
                menuItem.classList.add('blue');
            }
            
            // Create icon
            const icon = document.createElement('i');
            icon.className = 'material-icons';
            icon.textContent = item.icon || 'help_outline';
            
            // Create label
            const label = document.createElement('span');
            label.className = 'item-label';
            label.textContent = item.label || 'Option';
            
            // Append elements
            menuItem.appendChild(icon);
            menuItem.appendChild(label);
            
            // Add click event
            menuItem.addEventListener('click', () => {
                if (item.items && item.items.length > 0) {
                    // Submenu handling
                    this.open(item.items);
                } else {
                    // Action handling
                    this.handleItemClick(item);
                }
            });
            
            this.wrapper.appendChild(menuItem);
            this.menuItems.push(menuItem);
            
            // Add a small delay for the animation
            setTimeout(() => {
                menuItem.classList.add('visible');
            }, 10);
        });
    }

    positionMenuItems() {
        const itemCount = this.menuItems.length;
        if (itemCount === 0) return;
        
        const angleStep = (2 * Math.PI) / itemCount;
        
        this.menuItems.forEach((item, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = this.radius * Math.cos(angle);
            const y = this.radius * Math.sin(angle);
            
            item.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    handleItemClick(item) {
        if (!item) return;
        
        // Send data to game
        $.post('https://qb-radialmenu/selectItem', JSON.stringify({
            itemData: item
        }));
        
        // Close menu if specified
        if (item.shouldClose !== false) {
            this.close();
        }
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.menuItems = [];
        this.activeMenuData = null;
        
        // Fade out animation
        this.menuItems.forEach(item => {
            item.classList.remove('visible');
        });
        
        // Hide menu after animation
        setTimeout(() => {
            this.menuElement.style.display = 'none';
        }, 200);
        
        // Notify game that menu is closed
        $.post('https://qb-radialmenu/closeRadial', JSON.stringify({}));
    }
}

// Initialize menu when document is ready
$(document).ready(() => {
    window.RadialMenuInstance = new RadialMenu();
});