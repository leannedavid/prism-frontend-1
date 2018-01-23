import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Message } from 'primeng/components/common/api';

import { Group } from '../models/group.model';
import { User } from '../models/user.model';

import { GroupManagerService } from './group-manager.service';
import {  TreeNode } from 'primeng/primeng';

@Component({
  selector: 'prism-group-manager',
  templateUrl: './group-manager.component.html',
  styleUrls: ['./group-manager.component.css']
})

export class GroupManagerComponent implements OnInit {
  displayAdd: Boolean = false;
  displayDelete: Boolean = false;
  displayGroupManager: Boolean = false;

  group: Group = new Group();
  user: User = new User();

  groups: Group[] = [];
  users: User[] = [];
  groupMembers: User[] = [];
  memberList: User[] = [];

  filteredMembers: any[] = [];
  msgs: Message[] = [];

  suggestedUsers: any[] = [];

  constructor(private groupManagerService: GroupManagerService,
              private router: Router) { }

  ngOnInit() {
    this.groupManagerService.getUsers().subscribe( data => {
      this.users = data;
      console.log(data);
    })

    this.groupManagerService.getGroups().subscribe(data => {
      this.groups = data;

      for (let i = 0; i < this.groups.length; i++) {
        const members = this.groups[i].members;
        this.groups[i].members = this.getMembersObject(members);
      }
      console.log(this.groups)
    },
    err => {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('currentUser');
      this.router.navigate(['login']);
    });
  }

  invalidErrorMessage(message) {
    this.msgs = [];
    let detailMsg = '';

    switch (message) {
      case 'empty group':
        detailMsg = 'Please input a group name.';
        break;
      case 'invalid delete':
        detailMsg = 'Please select a valid group to delete.';
        break;
      case 'existing group':
        detailMsg = 'Name of group already exists.'
        break;
    }
    this.msgs.push({severity: 'error', summary: 'Invalid Group:', detail: detailMsg });
  }

  addGroupDialog() {
    this.msgs = [];
    this.group = new Group();
    this.displayAdd = true;
  }

  deleteGroupDialog() {
    this.msgs = [];
    this.displayDelete = true;
  }

  groupManagerDialog(id) {
    this.msgs = [];
    this.filteredMembers = [];
    this.displayGroupManager = true;
    this.groupManagerService.getGroup(id).subscribe(data => {
      this.group = data;
      this.getMembersObject(data.members);
    });
  }

  submitGroup() {
    if (typeof(this.group.name) !== 'undefined') {
      if (this.group.name.trim().length > 0) {
        const groupExists = this.groups.some( checkGroup =>
          checkGroup.name.toLowerCase() === this.group.name.toLowerCase()
        );

        if (!groupExists) {
          this.groupManagerService.addGroup(this.group).subscribe(
            data => {
              this.groups.push(data);
              this.groups = this.groups.slice(0);
            }
          );

          this.displayAdd = false;
          this.group = new Group();
        } else {
          this.invalidErrorMessage('existing group');
        }
      } else {
        this.invalidErrorMessage('empty group');
      }
    } else {
      this.invalidErrorMessage('empty group');
    }
  }

  deleteGroup(id) {
    if (typeof(id) !== 'undefined') {
      this.groupManagerService.deleteGroup(id).subscribe( () => {
        for (let i = 0; i < this.groups.length; i++) {
          if (this.groups[i]._id === id) {
            this.groups.splice(i, 1);
            break;
          }
        }
      });

      this.displayDelete = false;
      this.displayGroupManager = false;
      this.group = new Group();
    } else {
      this.invalidErrorMessage('invalid delete');
    }
  }

  updateGroup() {
    const findGroup = this.groups.find( item => item._id === this.group._id);
    const nameChange = findGroup.name === this.group.name ? false : true;

    /* Updating the group's name */
    if (this.group.name.trim().length > 0) {
      if (nameChange) {
        this.groupManagerService.updateGroup(this.group).subscribe( updatedGroup => {
          const index = this.groups.findIndex(oldGroup => oldGroup._id === updatedGroup._id);
          this.groups[index] = updatedGroup;
        });
        this.displayGroupManager = false;
      }
    } else {
      this.invalidErrorMessage('empty group');
    }

    /* Adding members to the group */
    if (this.suggestedUsers.length !== 0 ) {
      for (let i = 0; i < this.suggestedUsers.length; i++) {
        const userObj = this.users.find(foundUser => foundUser.username === this.suggestedUsers[i].name);

        this.groupManagerService.addMember(userObj._id, this.group._id).subscribe( newMember => {
          findGroup.members.push(newMember);
          this.groups = this.groups.slice(0);
        })
      }
      this.displayGroupManager = false;
    }
    this.group = new Group();
    this.suggestedUsers = [];

  }

  deleteMember(groupId, memberId) {
    this.groupManagerService.deleteMember(groupId, memberId).subscribe( () => {
      for (let i = 0; i < this.groups.length; i++) {
        if (this.groups[i]._id === groupId) {
          for (let j = 0; j < this.groups[i].members.length; j++) {
            if  (this.groups[i].members[j]._id === memberId) {
              this.groups[i].members.splice(j, 1);
              break;
            }
          }
        }
      }
    })
  }

  getMembersObject(memberList): any[] {
    const displayList = [];

    for (let i = 0; i < memberList.length; i++) {
      for (let j = 0; j < this.users.length; j++) {
        if (memberList[i] === this.users[j]._id) {
          displayList.push(this.users[j]);
        }
      }
    }
    return displayList;
  }

  filteredUsers(event) {
    this.filteredMembers = [];
    const query = event.query;
    this.filteredMembers = this.getSuggestedUser(query, this.users);
  }

  getSuggestedUser(username, users: any[]): any[] {
    const filtered = [];
    const currentMembers = this.getMembersObject(this.group.members);

    for (let i = 0; i < users.length; i ++) {
      if ((users[i].username).toLowerCase().indexOf(username.toLowerCase()) === 0) {
        filtered.push({'name': users[i].username});
      }
    }

    filtered.sort(this.compareUsernames);

    for (let i = 0; i < filtered.length; i++) {
      for (let j = 0; j < currentMembers.length; j++) {
        if ((filtered[i].name).toLowerCase() === (currentMembers[j].username).toLowerCase()) {
          filtered.splice(i, 1);
          break;
        }
      }
    }

    return filtered;
  }

  compareUsernames(user1, user2) {
    const username1 = user1.name.toLowerCase();
    const username2 = user2.name.toLowerCase();

    let compare = 0;

    if (username1 > username2) {
      compare = 1;
    } else if (username1 < username2) {
      compare = -1;
    }
    return compare;
  }
}
