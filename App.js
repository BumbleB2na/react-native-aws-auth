import React from 'react';
import { StyleSheet, Button, Text, TextInput, View, ScrollView, Linking, Alert, Platform } from 'react-native';

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
		hyperlinks: [
			{
				'title':'A Visited Url',
				'url':'https://example.com',
				'visited': true
			},
			{
				'url':'https://example.com/#url-with-no-title'
			},
			{
				'title':'A Bad Url',
				'url':'htp://example.com'
			},
		]
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
	openHyperlink = (hyperlinkObj, index) => {
		this.flagHyperlinkAsVisited(index);

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
	flagHyperlinkAsVisited = (index) => {
		let hyperlinks = this.state.hyperlinks;
		hyperlinks[index].visited = true;
		this.setState({
			hyperlinks: hyperlinks
		})
	};
	isUrlValid = (url) => {
		var isValid = url.length > 9 && (url.substr(0, 7) === 'http://' || url.substr(0, 8) === 'https://');
		return isValid;
	};
	saveHyperlink = () => {
		let newHyperlink = this.createHyperlinkFromState();
		let hyperlinks = this.state.hyperlinks;
		hyperlinks.unshift(newHyperlink);
		this.setState({
			hyperlinks: hyperlinks
		})
	};
	createHyperlinkFromState = () => {		
		let hyperlink = {
			url: this.state.url.trim()
		}
		if(this.state.title)
			hyperlink.title = this.state.title.trim();
		return hyperlink;
	};
	render() {
		return (
			<View style={styles.wrapper}>
				<View style={styles.footer}>
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
						// color="#eeaa55"
					/>
				</View>
				<ScrollView style={styles.list}>
					<Text style={styles.title}>Your Saves For Later</Text>
					{this.state.hyperlinks.map((hyperlink, index) => (
						<View key={index}>
							<Text
								style={[styles.hyperlink, hyperlink.visited ? styles.hyperlinkVisited : undefined]}
								onPress={() => this.openHyperlink(hyperlink, index)}
							>
								{ hyperlink.title || hyperlink.url }
							</Text>
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
		flex: 1
	},
	list: {
		backgroundColor: '#ccc',
		paddingHorizontal: 10,
		paddingVertical: 20
	},
	hyperlink: {
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
	footer: {
		borderBottomColor: '#999',
		borderBottomWidth: 1,
		backgroundColor: '#fff',
		paddingHorizontal: 10,
		paddingVertical: 20,
		paddingTop: 40
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