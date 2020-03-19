import React from 'react';
import { StyleSheet, Button, Text, TextInput, View, ScrollView, Linking, Alert, Platform, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// make API calls to GraphQL service
import Amplify from '@aws-amplify/core';
import config from './aws-exports';

import { Analytics } from 'aws-amplify';
Amplify.configure({
	...config,
	Analytics: {
		disabled: true
	}
});

// execute GraphQL queries
import API, { graphqlOperation } from '@aws-amplify/api';

// auth with Amazon Cognito - see line at end of App.js for usage:
import { withAuthenticator } from 'aws-amplify-react-native';
import Auth from '@aws-amplify/auth';
Auth.currentCredentials()
  .then(d => console.log('data: ', d))
  .catch(e => console.log('error: ', e))
const withAuthenticatorConfig = {
	includeGreetings: true,
	usernameAttributes: 'email',   // If Cognito was set up where Username must be an email then, this makes it so signup/signin will show "Email". Without this a user would see both "Username" and "Email" fields on Sign Up and then "Username" on Sign In.
	signUpConfig: {
		hiddenDefaults: ["phone_number"]
	}
};

class App extends React.Component {
	state = {
		title: '',
		url: 'https://',
		hyperlinks: [],
		owner: ''
	};
	resetInputState = () => {
		this.setState({
			title: '',
			url: 'https://'
		});
	};
	onChangeText = (key, val) => {
		this.setState({ [key]: val });
	};
	// get the current authenticated user to store "owner" details for GraphQL @auth and then, list the owned hyperlinks
	componentDidMount = async () => {
		try {
		await Auth.currentAuthenticatedUser()    
			.then(async (user) => {
				// store "owner" details for GraphQL @auth
				this.setState({
					owner: user.attributes.sub
				});

				// Get a list of hyperlinks
				const graphqldata = await API.graphql(graphqlOperation(ListHyperlinks));
				console.log('graphqldata: ', graphqldata);

				// Set state with a list of user's hyperlinks, sorted descending by createdOn ISO date
				let hyperlinks = graphqldata.data.listHyperlinks.items
					.sort(function(a, b) {
						return (a.createdOn > b.createdOn) ? -1 : ((a.createdOn < b.createdOn) ? 1 : 0);
					});
				this.setState({ hyperlinks: hyperlinks });
			});
		}
		catch(error) {
			console.log('error: ', error);
		}
	};
	onPressDeleteHyperlink = async (index) => {
		let hyperlinks = this.state.hyperlinks;
		const hyperlinkId = hyperlinks[index].id;

		// Update hyperlinks in state to reflect the change
		hyperlinks.splice(index, 1);
		this.setState({
			hyperlinks: hyperlinks
		})

		const deletedHyperlink = {
			id: hyperlinkId, 
			// owner: this.state.owner
		}
		await API.graphql(graphqlOperation(DeleteHyperlink, deletedHyperlink));
		console.log('Deleted hyperlink from database');
	};
	onPressSaveForLaterButton = () => {
		const isUrlEmpty = this.state.url.trim() === '';
		if(isUrlEmpty) {
			this.showAlertMessage('Whoops','You must enter a hyperlink to be saved for later');
			return;
		}
		const isUrlValid = this.isUrlValid(this.state.url);
		if(!isUrlValid) {
			this.showAlertMessage('Whoops','The hyperlink you entered is not valid');
			return;
		}
		this.saveHyperlink();
		this.resetInputState();
	};
	showAlertMessage = (title, msg) => {
		if(Platform.OS === 'ios' || Platform.OS === 'android')
			Alert.alert(title, msg);
		else
			alert(title + ': ' + msg);
	};
	setFocusToHyperlinkInput = () => {
		this.hyperlinkInput.focus();
	};
	openHyperlink = async (hyperlinkObj, index) => {
		await this.flagHyperlinkAsVisited(index);

		const url = hyperlinkObj.url;
		Linking.canOpenURL(url)
			.then(supported => {
				const isValidUrl = supported && this.isUrlValid(url);
				if(isValidUrl)
					Linking.openURL(url);
				else
					throw new Error();
			})
			.catch(error => {
				this.showAlertMessage('Whoops','Cannot go to this saved link');
			});
	};
	flagHyperlinkAsVisited = async (index) => {
		let hyperlinks = this.state.hyperlinks;
		hyperlinks[index].visited = true;
		this.setState({
			hyperlinks: hyperlinks
		})

		try {
			const updatedHyperlink = {
				id: hyperlinks[index].id, 
				visited: hyperlinks[index].visited, 
				owner: this.state.owner
			}
			await API.graphql(graphqlOperation(UpdateHyperlink, updatedHyperlink));
			console.log('Updated hyperlink in database');
		}
		catch(error) {
			this.showAlertMessage('Whoops','Failed to flag this link as visited for good');
			console.log('error: ', error);
		}
	};
	isUrlValid = (url) => {
		var isValid = url.length > 9 && (url.substr(0, 7) === 'http://' || url.substr(0, 8) === 'https://');
		return isValid;
	};
	saveHyperlink = async () => {
		let newHyperlink = this.createHyperlinkFromState();
		let hyperlinks = this.state.hyperlinks;
		hyperlinks.unshift(newHyperlink);
		this.setState({
			hyperlinks: hyperlinks
		});

		try {
			const hyperlink = await API.graphql(graphqlOperation(AddHyperlink, newHyperlink));
			console.log('Created hyperlink in database');

			// update hyperlink in state with its id so that if updated later the change can be persisted to database
			this.state.hyperlinks[0].id = hyperlink.data.createHyperlink.id;
		}
		catch(error) {
			this.showAlertMessage('Whoops','Failed to save this link for good');
			console.log('error: ', error);
		}
	};
	createHyperlinkFromState = () => {		
		let hyperlink = {
			url: this.state.url.trim(),
			visited: false,
			createdOn: (new Date()).toISOString(),
			owner: this.state.owner
		}
		if(this.state.title)
			hyperlink.title = this.state.title;
		return hyperlink;
	};
	render() {
		return (
			<View style={styles.wrapper}>
				<View style={styles.header}>
					<Text style={styles.title}>Save For Later</Text>
					<Text style={styles.subtitle}>What do you want to read, watch or listen to?</Text>
					<TextInput
						ref={(input) => { this.titleInput = input; }}
						style={styles.input}
						value={this.state.title}
						onChangeText={val => this.onChangeText('title', val)}
						onSubmitEditing={this.setFocusToHyperlinkInput}
						placeholder="Title (optional)"
						returnKeyType="next"
					/>
					<TextInput
						ref={(input) => { this.hyperlinkInput = input; }}
						style={styles.input}
						value={this.state.url}
						onChangeText={val => this.onChangeText('url', val)}
						onSubmitEditing={this.onPressSaveForLaterButton}
						placeholder="https://"
						autoCapitalize="none"
						keyboardType="url"
						returnKeyType="done"
						selectTextOnFocus
					/>
					<Button
						ref={(button) => { this.saveForLaterButton = button; }}
						onPress={this.onPressSaveForLaterButton}
						title="Save For Later"
						accessibilityLabel="Save Your Hyperlink For Later"
						color="#ff9900"
						padding={44}
					/>
				</View>
				<ScrollView style={styles.list}>
					<Text style={styles.title}>Your Saved Links</Text>
					{this.state.hyperlinks.map((hyperlink, index) => (
						<View key={index} style={styles.hyperlinkRow}>
							<Text
								style={[styles.hyperlink, hyperlink.visited ? styles.hyperlinkVisited : undefined]}
								onPress={() => this.openHyperlink(hyperlink, index)}
							>
								{ hyperlink.title || hyperlink.url }
							</Text>
							<TouchableOpacity style={styles.hyperlinkDelete} onPressOut={() => this.onPressDeleteHyperlink(index)}>
								<MaterialIcons
									name="delete-forever"
									size={24}
									color="#2d2d2d"
								/>
							</TouchableOpacity>
						</View>
					))}
				</ScrollView>
			</View>
		);
	}
}

// GraphQL query to get hyperlinks
const ListHyperlinks = `
query Read {
	listHyperlinks {
		items {
			id
			title
			url
			visited
			createdOn
			owner
		}
	}
}
`;
// GraphQL mutation to update an existing hyperlink
const UpdateHyperlink = `
mutation ($id: ID! $visited: Boolean $owner: String!) {
	updateHyperlink(input: {
		id: $id
		visited: $visited
		owner: $owner
	}) {
		id 
		title 
		url
		visited
		createdOn
		owner
	}
}
`;
// GraphQL mutation to delete an existing hyperlink
const DeleteHyperlink = `
mutation ($id: ID!) {
	deleteHyperlink(input: {
		id: $id
	}) { 
		id
	}
}
`;
// GraphQL mutation to add a new hyperlink
const AddHyperlink = `
mutation ($title: String $url: String! $visited: Boolean! $createdOn: String! $owner: String!) {
	createHyperlink(input: {
		title: $title
		url: $url
		visited: $visited
		createdOn: $createdOn
		owner: $owner
	}) {
		id 
		title 
		url
		visited
		createdOn
		owner
	}
}
`;

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		borderTopWidth: 1,
		borderTopColor: '#999'
	},
	list: {
		backgroundColor: '#ccc',
		paddingHorizontal: 10,
		paddingVertical: 20
	},
	hyperlinkRow: {
		flexDirection: 'row'
	},
	hyperlink: {
		flex: 1,
		fontSize: 20,
		color: 'blue',
		marginVertical: 10,
		borderLeftColor: 'grey',
		borderLeftWidth: 4,
		paddingHorizontal: 10
	},
	hyperlinkVisited: {
		color: 'purple',
		textDecorationLine: 'line-through'
	},
	hyperlinkDelete: {
		marginTop: 10
	},
	header: {
		borderBottomColor: '#999',
		borderBottomWidth: 1,
		backgroundColor: '#fff',
		paddingHorizontal: 10,
		paddingVertical: 20,
		paddingTop: 20
	},
	title: {
		fontSize: 20,
		marginBottom: 20
	},
	subtitle: {
		fontSize: 12,
		marginBottom: 20
	},
	input: {
		height: 50,
		borderBottomWidth: 2,
		borderBottomColor: 'blue',
		marginBottom: 20
	}
});

export default withAuthenticator(App, withAuthenticatorConfig);