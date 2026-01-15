
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Notification } from '../components/Notification';
import { InventoryItem } from '../types';

// Mock de Capacitor Local Notifications para entorno web/desarrollo
const LocalNotifications = {
    schedule: async (options: any) => {
        console.log("Push Notification Scheduled:", options);
        if (Notification.permission === "granted") {
            new window.Notification(options.notifications[0].title, {
                body: options.notifications[0].body
            });
        }
    },
    requestPermissions: async () => {
        if ("Notification" in window) {
            return await window.Notification.requestPermission();
        }
        return "denied";
    }
};

interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error') => void;
  checkInventoryAlerts: (items: InventoryItem[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const checkInventoryAlerts = useCallback((items: InventoryItem[]) => {
      const lowStockItems = items.filter(i => i.minStock !== undefined && i.currentQuantity <= i.minStock);
      
      if (lowStockItems.length > 0) {
          LocalNotifications.schedule({
              notifications: [{
                  id: 1,
                  title: "⚠️ Alerta de Inventario Crítico",
                  body: `Tienes ${lowStockItems.length} insumos por debajo del stock mínimo.`,
                  schedule: { at: new Date(Date.now() + 1000) }
              }]
          });
          showNotification(`Atención: ${lowStockItems.length} productos con stock bajo.`, 'error');
      }
  }, [showNotification]);

  useEffect(() => {
      LocalNotifications.requestPermissions();
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, checkInventoryAlerts }}>
      {children}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};
