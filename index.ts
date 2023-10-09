import { type Plugin, type App, inject, getCurrentInstance } from "vue";
import "reflect-metadata";

export function service<T extends { new(...args: any[]): {} }>(type:T) {
	return function (target: any, prop: string) {
		Reflect.defineMetadata('#service', type, target, prop)
	}
}

type RegisteredService = {
	singleton:boolean
	constructor:() => any
}
export type Service = { 
	new(...args: any[]): any
 };
export abstract class ServiceRegistry {
	protected services:Record<string, RegisteredService> = {};
	protected singletons:Record<string, any> = {};

	constructor () {
		this.singletons[ServiceRegistry.name] = this;
		this.services[ServiceRegistry.name] = {
			constructor: () => this,
			singleton: true
		}
	}
	
	AddSingleton<T extends Service>(serviceToRegister:T, ...args: any[]): ServiceRegistry {
		this.register(serviceToRegister.name, true, () => new serviceToRegister(...args));
		return this;
	}
	AddTransiant<T extends Service>(serviceToRegister:T, ...args: any[]):ServiceRegistry {
		this.register(serviceToRegister.name, false, () => new serviceToRegister(...args));
		return this;
	}
	
	private register(name:string, singleton:boolean, constructor: () => any) {
		if (this.services[name]) {
			throw new Error(`${name} already is registered`);
		}
		this.services[name] = {
			constructor: constructor,
			singleton: singleton
		}

	}
}
class PrivateServiceRegistry extends ServiceRegistry {
	GetService<T extends object>(serviceToCreate:new(...args: any[])=> T):T {

		if (!this.services[serviceToCreate.name]) {
			throw new Error(`${serviceToCreate.name} is not registered`);
		}
		if (this.services[serviceToCreate.name].singleton && this.singletons[serviceToCreate.name]) {
			return <T>this.singletons[serviceToCreate.name];
		}
		
		const a:any = this.services[serviceToCreate.name].constructor();
		
		for(var prop of <(keyof T)[]>Object.keys(a)) {
			const con:Service|undefined = Reflect.getMetadata("#service", a , String(prop));
			if (con) {
				a[prop] = this.GetService(con);
			}
		}
		
		if (a["init"]) {
			a["init"]();
		}
		
		if (a["setup"]) {
			a["setup"]();
		}
		
		if (a["initialize"]) {
			a["initialize"]();
		}
		
		if (a["initializer"]) {
			a["initializer"]();
		}

		if (this.services[serviceToCreate.name].singleton) {
			this.singletons[serviceToCreate.name] = a;
		}

		return a;
	}
}
export class ServiceProvider {
	private registery: PrivateServiceRegistry;
	private app: App;
	constructor(registery: PrivateServiceRegistry, app: App) {
		this.registery = registery;
		this.app = app;
	}

	GetService<T extends object>(serviceToCreate:new(...args: any[])=> T):T {
		try {
			return this.registery.GetService(serviceToCreate);
		}
		catch {
			for (var prop of Object.keys(this.app._context.provides)) {
				if (this.app._context.provides[prop]?.constructor?.name === serviceToCreate.name) {
					return this.app._context.provides[prop];
				}
			}
			throw new Error(`Unable to find service ${serviceToCreate.name}`);
		}
	}
}

export const ServiceRegistryKey = "@barfittc/vue-service-provider#Registry"
export const ServiceProviderKey = "@barfittc/vue-service-provider#Provider"
export function addServiceProvider ():Plugin {
	return function(app:App){

		const registery = new PrivateServiceRegistry();
		registery.AddSingleton(ServiceProvider, registery, app);
		app.provide(ServiceProviderKey, registery.GetService(ServiceProvider));
		app.provide(ServiceRegistryKey, registery);
	}
}

export function getService<T extends object>(serviceToCreate:new(...args: any[])=> T):T {
	const services = inject<ServiceProvider>(ServiceProviderKey);
	if (!services) {
		throw new Error(`ServiceProvider is not injected, called from out of setup?`);
	}
	return services.GetService<T>(serviceToCreate);
}

export function getServiceProvider():ServiceProvider {
	const services = inject<ServiceProvider>(ServiceProviderKey);
	if (!services) {
		throw new Error(`ServiceProvider is not injected, called from out of setup?`);
	}
	return services;
}

export function getRegistry(app?:App) {
	if (app === undefined) {
		app = getCurrentInstance()?.appContext.app
	}
	if (app === undefined) {
		throw new Error("getRegistery needs to be passed app, or called from setup");
	}
	return <ServiceRegistry>app._context.provides[ServiceRegistryKey];
}